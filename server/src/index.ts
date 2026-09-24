import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import applicationRoutes from './routes/applications.js';
import documentRoutes from './routes/documents.js';
import serviceRoutes from './routes/services.js';
import paymentRoutes from './routes/payments.js';
import invoiceRoutes from './routes/invoices.js';
import employeeRoutes from './routes/employees.js';
import taskRoutes from './routes/tasks.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import settingRoutes from './routes/settings.js';
import trackRoutes from './routes/track.js';
import activityRoutes from './routes/activityLogs.js';
import searchRoutes from './routes/search.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists and serve static uploads
const uploadsDir = path.resolve(process.cwd(), 'server/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Public health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    portal: 'BizLink Operations Management System',
    location: 'Dubai, UAE',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/activity-logs', activityRoutes);
app.use('/api/search', searchRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`[BIZLINK SERVER] Operations Management API running on http://localhost:${PORT}`);
});

export default app;
