import mongoose from 'mongoose';
import { config } from './config/env.js';
import { User } from './modules/auth/user.model.js';
import { RFQ } from './modules/rfqs/rfq.model.js';
import { RFQ_STATUS } from './modules/rfqs/rfq.state-machine.js';
import { Quotation } from './modules/quotations/quotation.model.js';
import { Order } from './modules/orders/order.model.js';
import { AuditLog } from './modules/audit/audit.model.js';

export const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('[Seed] Connected to MongoDB');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      RFQ.deleteMany({}),
      Quotation.deleteMany({}),
      Order.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing data');

    // 1. Create Users
    console.log('[Seed] Creating demo users...');
    const buyer = await User.create({
      name: 'Ramesh Kumar (Buyer)',
      email: 'buyer@abc.com',
      password: 'password123',
      role: 'BUYER',
      organization: 'ABC Heavy Engineering Ltd',
      region: 'Chennai',
    });

    const vendor1 = await User.create({
      name: 'Karthik Raja (Vendor)',
      email: 'vendor1@tamilbearings.com',
      password: 'password123',
      role: 'VENDOR',
      organization: 'Tamil Bearings & Spares',
      region: 'Chennai',
    });

    const vendor2 = await User.create({
      name: 'Anand V. (Vendor)',
      email: 'vendor2@southernsteels.com',
      password: 'password123',
      role: 'VENDOR',
      organization: 'Southern Steels & Alloys',
      region: 'Coimbatore',
    });

    const vendor3 = await User.create({
      name: 'Sunil Gowda (Vendor)',
      email: 'vendor3@bangaloreparts.com',
      password: 'password123',
      role: 'VENDOR',
      organization: 'Bangalore Precision Works',
      region: 'Bangalore',
    });

    // 2. Create RFQ 1: Open for bidding (600 units Ball Bearings)
    console.log('[Seed] Creating RFQ 1 (OPEN with 2 competitive quotations)...');
    const deadline1 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const rfq1 = await RFQ.create({
      rfq_number: 'RFQ-2026-0001',
      buyer_id: buyer._id,
      title: '600 Units Deep Groove Radial Ball Bearings (6205-2RS)',
      description: 'Precision chrome steel bearings with dual contact rubber seals, pre-lubricated for high-load conveyor shafts.',
      category: 'Mechanical Components',
      quantity: 600,
      unit: 'units',
      region: 'Chennai',
      deadline: deadline1,
      status: RFQ_STATUS.OPEN,
    });

    // Competitive Quotation A (Tamil Bearings - Local, Lower Lead Time)
    await Quotation.create({
      rfq_id: rfq1._id,
      vendor_id: vendor1._id,
      slabs: [
        { min_qty: 1, max_qty: 99, unit_price: 90 },
        { min_qty: 100, max_qty: 499, unit_price: 80 },
        { min_qty: 500, max_qty: null, unit_price: 70 },
      ],
      evaluated_unit_price: 70,
      evaluated_total_price: 42000,
      lead_time_days: 3,
      validity_date: deadline1,
      notes: 'Local warehouse dispatch within 3 days. Free delivery in Chennai hub.',
      status: 'SUBMITTED',
    });

    // Competitive Quotation B (Southern Steels - Regional, Competitive)
    await Quotation.create({
      rfq_id: rfq1._id,
      vendor_id: vendor2._id,
      slabs: [
        { min_qty: 1, max_qty: 199, unit_price: 95 },
        { min_qty: 200, max_qty: 499, unit_price: 82 },
        { min_qty: 500, max_qty: null, unit_price: 74 },
      ],
      evaluated_unit_price: 74,
      evaluated_total_price: 44400,
      lead_time_days: 7,
      validity_date: deadline1,
      notes: 'Premium SKF equivalent grade with 1-year replacement warranty.',
      status: 'SUBMITTED',
    });

    // 3. Create RFQ 2: Approved procurement ready for Purchase Order issuance
    console.log('[Seed] Creating RFQ 2 (APPROVED - Ready for PO)...');
    const deadline2 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const rfq2 = await RFQ.create({
      rfq_number: 'RFQ-2026-0002',
      buyer_id: buyer._id,
      title: '1200 Kg Precision Cold Rolled Steel Coils (CR4 Grade)',
      description: 'Thickness: 1.5mm, Width: 1250mm, Grade: CR4 Deep Drawing. Test certificates required with delivery.',
      category: 'Raw Materials & Metals',
      quantity: 1200,
      unit: 'kg',
      region: 'Chennai',
      deadline: deadline2,
      status: RFQ_STATUS.APPROVED,
      selected_vendor_id: vendor2._id,
      selected_total_amount: 108000,
    });

    const quote2 = await Quotation.create({
      rfq_id: rfq2._id,
      vendor_id: vendor2._id,
      slabs: [
        { min_qty: 100, max_qty: 999, unit_price: 95 },
        { min_qty: 1000, max_qty: null, unit_price: 90 },
      ],
      evaluated_unit_price: 90,
      evaluated_total_price: 108000,
      lead_time_days: 10,
      validity_date: deadline2,
      notes: 'Includes test certificates and moisture-resistant packaging.',
      status: 'ACCEPTED',
    });

    rfq2.selected_quotation_id = quote2._id;
    await rfq2.save();

    // 4. Create RFQ 3: Completed lifecycle with PO Issued
    console.log('[Seed] Creating RFQ 3 & PO 1 (PO_ISSUED)...');
    const deadline3 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const rfq3 = await RFQ.create({
      rfq_number: 'RFQ-2026-0003',
      buyer_id: buyer._id,
      title: '250 Sets Heavy Duty Flange Couplings (FC-25)',
      description: 'Cast iron flexible flange couplings with rubber pin bushings for heavy vibrating pumps.',
      category: 'Mechanical Components',
      quantity: 250,
      unit: 'sets',
      region: 'Coimbatore',
      deadline: deadline3,
      status: RFQ_STATUS.PO_ISSUED,
      selected_vendor_id: vendor3._id,
      selected_total_amount: 37500,
    });

    const quote3 = await Quotation.create({
      rfq_id: rfq3._id,
      vendor_id: vendor3._id,
      slabs: [
        { min_qty: 50, max_qty: 199, unit_price: 165 },
        { min_qty: 200, max_qty: null, unit_price: 150 },
      ],
      evaluated_unit_price: 150,
      evaluated_total_price: 37500,
      lead_time_days: 6,
      validity_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      notes: 'Dynamic balanced up to 3000 RPM.',
      status: 'ACCEPTED',
    });

    rfq3.selected_quotation_id = quote3._id;
    await rfq3.save();

    await Order.create({
      po_number: 'PO-2026-0001',
      rfq_id: rfq3._id,
      quotation_id: quote3._id,
      buyer_id: buyer._id,
      vendor_id: vendor3._id,
      item_details: {
        title: rfq3.title,
        category: rfq3.category,
        quantity: rfq3.quantity,
        unit: rfq3.unit,
        unit_price: 150,
        total_amount: 37500,
      },
      total_amount: 37500,
      delivery_deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      terms: 'Standard MSME Commercial Terms: Net 30 days upon inspection & delivery.',
      status: 'ISSUED',
    });

    // 5. Seed Historical Milestones for RFQs
    await AuditLog.create([
      {
        entity_type: 'RFQ',
        entity_id: rfq1._id,
        action: 'CREATE_DRAFT',
        from_state: null,
        to_state: RFQ_STATUS.DRAFT,
        performed_by: buyer._id,
        notes: 'Requirement drafted for 600 units radial bearings',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq1._id,
        action: 'PUBLISH',
        from_state: RFQ_STATUS.DRAFT,
        to_state: RFQ_STATUS.OPEN,
        performed_by: buyer._id,
        notes: 'Requirement published to regional suppliers in Chennai',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq1._id,
        action: 'SUBMIT_QUOTE',
        from_state: RFQ_STATUS.OPEN,
        to_state: RFQ_STATUS.OPEN,
        performed_by: vendor1._id,
        notes: 'Quotation submitted: ₹70/unit, Total ₹42,000 (Lead time: 3 days)',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq1._id,
        action: 'SUBMIT_QUOTE',
        from_state: RFQ_STATUS.OPEN,
        to_state: RFQ_STATUS.OPEN,
        performed_by: vendor2._id,
        notes: 'Quotation submitted: ₹74/unit, Total ₹44,400 (Lead time: 7 days)',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq2._id,
        action: 'CREATE_DRAFT',
        from_state: null,
        to_state: RFQ_STATUS.DRAFT,
        performed_by: buyer._id,
        notes: 'Requirement drafted for 12,000 kg Cold Rolled Steel Coils',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq2._id,
        action: 'PUBLISH',
        from_state: RFQ_STATUS.DRAFT,
        to_state: RFQ_STATUS.OPEN,
        performed_by: buyer._id,
        notes: 'Published bulk raw materials requirement to Coimbatore and Bangalore suppliers',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq2._id,
        action: 'SUBMIT_QUOTE',
        from_state: RFQ_STATUS.OPEN,
        to_state: RFQ_STATUS.OPEN,
        performed_by: vendor2._id,
        notes: 'Quotation submitted: ₹9/kg, Total ₹1,08,000 (Lead time: 5 days)',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq2._id,
        action: 'SELECT_VENDOR',
        from_state: RFQ_STATUS.OPEN,
        to_state: RFQ_STATUS.APPROVED,
        performed_by: buyer._id,
        notes: 'Selected Southern Steels & Alloys quotation (Total: ₹1,08,000)',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq3._id,
        action: 'CREATE_DRAFT',
        from_state: null,
        to_state: RFQ_STATUS.DRAFT,
        performed_by: buyer._id,
        notes: 'Requirement drafted for 250 Sets Heavy Duty Flange Couplings',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq3._id,
        action: 'PUBLISH',
        from_state: RFQ_STATUS.DRAFT,
        to_state: RFQ_STATUS.OPEN,
        performed_by: buyer._id,
        notes: 'Requirement published to precision engineering suppliers',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq3._id,
        action: 'SUBMIT_QUOTE',
        from_state: RFQ_STATUS.OPEN,
        to_state: RFQ_STATUS.OPEN,
        performed_by: vendor3._id,
        notes: 'Quotation submitted: ₹150/unit, Total ₹37,500 (Lead time: 6 days)',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq3._id,
        action: 'SELECT_VENDOR',
        from_state: RFQ_STATUS.OPEN,
        to_state: RFQ_STATUS.APPROVED,
        performed_by: buyer._id,
        notes: 'Selected Bangalore Precision Works quotation (Total: ₹37,500)',
      },
      {
        entity_type: 'RFQ',
        entity_id: rfq3._id,
        action: 'GENERATE_PO',
        from_state: RFQ_STATUS.APPROVED,
        to_state: RFQ_STATUS.PO_ISSUED,
        performed_by: buyer._id,
        notes: 'Binding Purchase Order PO-2026-0001 issued',
      },
    ]);

    console.log('[Seed] Database successfully seeded!');
    console.log('----------------------------------------------------');
    console.log('Demo Accounts:');
    console.log('  Buyer:   buyer@abc.com            / password123 (Chennai)');
    console.log('  Vendor:  vendor1@tamilbearings.com / password123 (Chennai)');
    console.log('  Vendor:  vendor2@southernsteels.com/ password123 (Coimbatore)');
    console.log('  Vendor:  vendor3@bangaloreparts.com/ password123 (Bangalore)');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

// Execute if run directly
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}
