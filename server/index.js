import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import paymentRoutes from './routes/payment.js';
import callbackRoutes from './routes/callback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

const app = express();
app.use(express.json());

app.use('/api/payment', paymentRoutes);
app.use('/', callbackRoutes);

if (process.env.NODE_ENV === 'production') {
  const distDir = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[server] Fintrixpay payment backend listening on port ${PORT}`);
});
