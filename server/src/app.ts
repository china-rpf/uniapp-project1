import express from 'express';
import cors from 'cors';
import authRouter from './modules/auth/router';
import classRouter from './modules/class/router';
import messageRouter from './modules/message/router';
import friendshipRouter from './modules/friendship/router';
import uploadRouter, { UPLOAD_DIR } from './modules/upload/router';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(UPLOAD_DIR));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRouter);
app.use('/classes', classRouter);
app.use('/conversations', messageRouter);
app.use('/messages', messageRouter);  // Uses same router, but /send endpoint for sending
app.use('/friends', friendshipRouter);
app.use('/upload', uploadRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
