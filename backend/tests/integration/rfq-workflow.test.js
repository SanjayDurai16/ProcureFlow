import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { config } from '../../src/config/env.js';
import { User } from '../../src/modules/auth/user.model.js';
import { RFQ } from '../../src/modules/rfqs/rfq.model.js';
import { Order } from '../../src/modules/orders/order.model.js';

describe('ProcureFlow End-to-End API Workflow & Authorization Tests', () => {
  let buyerToken;
  let buyer2Token;
  let vendorToken;
  let vendor2Token;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }

    // Clean test state
    await User.deleteMany({ email: /test.*@example\.com/ });
    await RFQ.deleteMany({ title: /Integration Test.*/ });
    await Order.deleteMany({});

    // 1. Primary Buyer (Org A)
    const buyerRes = await request(app).post('/api/auth/register').send({
      name: 'Integration Test Buyer',
      email: 'testbuyer@example.com',
      password: 'password123',
      role: 'BUYER',
      organization: 'Test Manufacturing Co',
      region: 'Chennai',
    });
    buyerToken = buyerRes.body.data.token;

    // 2. Secondary Buyer (Org B) for cross-tenant security testing
    const buyer2Res = await request(app).post('/api/auth/register').send({
      name: 'Secondary Buyer Org B',
      email: 'testbuyer2@example.com',
      password: 'password123',
      role: 'BUYER',
      organization: 'Competitor Heavy Industries',
      region: 'Coimbatore',
    });
    buyer2Token = buyer2Res.body.data.token;

    // 3. Primary Vendor
    const vendorRes = await request(app).post('/api/auth/register').send({
      name: 'Integration Test Vendor',
      email: 'testvendor@example.com',
      password: 'password123',
      role: 'VENDOR',
      organization: 'Test Precision Supplies',
      region: 'Chennai',
    });
    vendorToken = vendorRes.body.data.token;

    // 4. Secondary Vendor
    const vendor2Res = await request(app).post('/api/auth/register').send({
      name: 'Secondary Test Vendor',
      email: 'testvendor2@example.com',
      password: 'password123',
      role: 'VENDOR',
      organization: 'Southern Fasteners Ltd',
      region: 'Chennai',
    });
    vendor2Token = vendor2Res.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: /test.*@example\.com/ });
    await RFQ.deleteMany({ title: /Integration Test.*/ });
    await Order.deleteMany({});
    await mongoose.disconnect();
  });

  it('Health Check responds with healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('Enforces RBAC: Vendor cannot create RFQ (returns 403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/rfqs')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        title: 'Integration Test Vendor RFQ',
        description: 'Should fail due to lack of buyer role',
        category: 'Metals',
        quantity: 100,
        unit: 'kg',
        region: 'Chennai',
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Enforces Cross-Organization Privacy: Buyer B cannot access Buyer A draft RFQ', async () => {
    // Buyer A drafts an RFQ
    const createRes = await request(app)
      .post('/api/rfqs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Integration Test Confidential Gearboxes',
        description: 'Confidential prototype gearboxes specification',
        category: 'Machinery',
        quantity: 10,
        unit: 'units',
        region: 'Chennai',
        deadline: new Date(Date.now() + 86400000).toISOString(),
      });
    expect(createRes.status).toBe(201);
    const draftId = createRes.body.data.rfq._id;

    // Buyer B attempts to read Buyer A's draft RFQ
    const crossReadRes = await request(app)
      .get(`/api/rfqs/${draftId}`)
      .set('Authorization', `Bearer ${buyer2Token}`);
    expect(crossReadRes.status).toBe(403);
    expect(crossReadRes.body.error.code).toBe('FORBIDDEN');

    // Vendor attempts to read draft RFQ before publication
    const vendorDraftRes = await request(app)
      .get(`/api/rfqs/${draftId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(vendorDraftRes.status).toBe(403);
  });

  it('Complete Lifecycle: Draft -> Publish -> Competing Quotes -> Vendor Selection -> PO Generation -> Fulfillment', async () => {
    // 1. Buyer A creates RFQ (Draft)
    const createRes = await request(app)
      .post('/api/rfqs')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Integration Test 1000 Units Flange Bolts',
        description: 'Grade 8.8 high tensile hex head bolts for industrial machinery',
        category: 'Fasteners',
        quantity: 1000,
        unit: 'pcs',
        region: 'Chennai',
        deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.rfq.status).toBe('DRAFT');
    const rfqId = createRes.body.data.rfq._id;

    // 2. Attempting to generate PO directly from DRAFT must be rejected by FSM (422)
    const prematurePORes = await request(app)
      .post(`/api/rfqs/${rfqId}/generate-po`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(prematurePORes.status).toBe(422);
    expect(prematurePORes.body.error.code).toBe('INVALID_STATE_TRANSITION');

    // 3. Buyer publishes RFQ (DRAFT -> OPEN)
    const publishRes = await request(app)
      .patch(`/api/rfqs/${rfqId}/publish`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.rfq.status).toBe('OPEN');

    // 4. Vendor 1 submits quote with tiered pricing slabs
    const quote1Res = await request(app)
      .post(`/api/quotes/rfq/${rfqId}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        slabs: [
          { min_qty: 1, max_qty: 499, unit_price: 75 },
          { min_qty: 500, max_qty: null, unit_price: 60 },
        ],
        lead_time_days: 4,
        validity_date: new Date(Date.now() + 10 * 86400000).toISOString(),
        notes: 'Delivery guaranteed within 4 working days.',
      });

    expect(quote1Res.status).toBe(201);
    expect(quote1Res.body.data.quotation.evaluated_unit_price).toBe(60);
    expect(quote1Res.body.data.quotation.evaluated_total_price).toBe(60000);
    const quotation1Id = quote1Res.body.data.quotation._id;

    // 5. Vendor 2 submits competing quotation
    const quote2Res = await request(app)
      .post(`/api/quotes/rfq/${rfqId}`)
      .set('Authorization', `Bearer ${vendor2Token}`)
      .send({
        slabs: [
          { min_qty: 1, max_qty: null, unit_price: 65 },
        ],
        lead_time_days: 2,
        validity_date: new Date(Date.now() + 10 * 86400000).toISOString(),
        notes: 'Faster delivery dispatch.',
      });
    expect(quote2Res.status).toBe(201);

    // 6. Vendor quote isolation: Vendor 2 can only see their own quote
    const vendor2QuotesRes = await request(app)
      .get(`/api/quotes/rfq/${rfqId}`)
      .set('Authorization', `Bearer ${vendor2Token}`);
    expect(vendor2QuotesRes.status).toBe(200);
    expect(vendor2QuotesRes.body.data.quotes.length).toBe(1);
    expect(vendor2QuotesRes.body.data.quotes[0]._id).toBe(quote2Res.body.data.quotation._id);

    // 7. Cross-tenant quotation protection: Buyer B cannot read Buyer A quotes
    const buyer2QuotesRes = await request(app)
      .get(`/api/quotes/rfq/${rfqId}`)
      .set('Authorization', `Bearer ${buyer2Token}`);
    expect(buyer2QuotesRes.status).toBe(403);

    // 8. Buyer A reads comparison matrix (identifies lowest price and fastest delivery with tie support)
    const compareRes = await request(app)
      .get(`/api/quotes/rfq/${rfqId}`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(compareRes.status).toBe(200);
    expect(compareRes.body.data.quotes.length).toBe(2);
    expect(compareRes.body.data.comparison.lowestPrice).toBe(60000);
    expect(compareRes.body.data.comparison.fastestLeadTime).toBe(2);

    // 9. Cross-tenant selection protection: Buyer B cannot select vendor for Buyer A RFQ
    const invalidSelectRes = await request(app)
      .post(`/api/rfqs/${rfqId}/select`)
      .set('Authorization', `Bearer ${buyer2Token}`)
      .send({ quotationId: quotation1Id });
    expect(invalidSelectRes.status).toBe(403);

    // 10. Buyer A selects winning vendor -> directly approved
    const selectRes = await request(app)
      .post(`/api/rfqs/${rfqId}/select`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ quotationId: quotation1Id });

    expect(selectRes.status).toBe(200);
    expect(selectRes.body.data.rfq.status).toBe('APPROVED');

    // 11. Cross-tenant PO generation protection: Buyer B cannot issue PO for Buyer A RFQ
    const unauthorizedPORes = await request(app)
      .post(`/api/rfqs/${rfqId}/generate-po`)
      .set('Authorization', `Bearer ${buyer2Token}`);
    expect(unauthorizedPORes.status).toBe(403);

    // 12. Buyer A generates formal Purchase Order
    const poRes = await request(app)
      .post(`/api/rfqs/${rfqId}/generate-po`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(poRes.status).toBe(201);
    expect(poRes.body.data.order.po_number).toMatch(/^PO-\d{4}-\d{4}$/);
    expect(poRes.body.data.order.total_amount).toBe(60000);
    const orderId = poRes.body.data.order._id;

    // 13. PO Idempotency: Second attempt to generate PO returns the existing PO without duplicate
    const secondPORes = await request(app)
      .post(`/api/rfqs/${rfqId}/generate-po`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(secondPORes.status).toBe(201);
    expect(secondPORes.body.data.order._id).toBe(orderId);

    // 14. Order Fulfillment Progression: Vendor acknowledges PO
    const ackRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: 'ACKNOWLEDGED' });
    expect(ackRes.status).toBe(200);
    expect(ackRes.body.data.order.status).toBe('ACKNOWLEDGED');

    // 15. Vendor fulfills PO
    const fulfillRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: 'FULFILLED' });
    expect(fulfillRes.status).toBe(200);
    expect(fulfillRes.body.data.order.status).toBe('FULFILLED');

    // 16. State machine prevents illegal backward order transition
    const backwardRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: 'ACKNOWLEDGED' });
    expect(backwardRes.status).toBe(422);

    // 17. Verify chronological RFQ timeline records all milestone events
    const timelineRes = await request(app)
      .get(`/api/rfqs/${rfqId}/timeline`)
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(timelineRes.status).toBe(200);
    const actions = timelineRes.body.data.timeline.map((e) => e.action);
    expect(actions).toContain('CREATE_DRAFT');
    expect(actions).toContain('PUBLISH');
    expect(actions).toContain('SUBMIT_QUOTE');
    expect(actions).toContain('SELECT_VENDOR');
    expect(actions).toContain('GENERATE_PO');
  });
});
