
// ============================================
// server.js - CORRECTED VERSION
// ============================================
import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import Route from './routes/userRoute.js'; // ✅ FIX 1: Default import, not named
import { initPinecone } from "./services/getEmbeddings.js";

// ✅ Load environment variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
    origin: 'https://portfolio-omega-vert-ehkt9x89mo.vercel.app/', // Your React app URL
    credentials: true
  }));
// Request logger (optional but helpful)
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${new Date().toLocaleTimeString()}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Second Brain API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      createNote: 'POST /note',
      searchNotes: 'GET /getnotes?query=your_search'
    }
  });
});

// Routes
app.use('/api', Route);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, async () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 SECOND BRAIN API SERVER');
  console.log('='.repeat(50));
  
  try {
    await initPinecone();
    console.log('✅ Pinecone initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing Pinecone:', err.message);
    console.warn('⚠️  Server started but Pinecone connection failed');
  }
  
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});
