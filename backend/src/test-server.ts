import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const server = app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
});

server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
});

// Keep process alive
process.stdin.resume();
