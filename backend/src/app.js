import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import rfqRoutes from './modules/rfqs/rfq.routes.js';
import quotationRoutes from './modules/quotations/quotation.routes.js';
import orderRoutes from './modules/orders/order.routes.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotes', quotationRoutes);
app.use('/api/orders', orderRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
