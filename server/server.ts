import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/authRoutes.js';
import productRouter from './routes/productRoute.js';
import uploadRouter from './routes/uploadRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import { serve } from 'inngest/express';
import { inngest, functions } from './inngest/index.js';
import addressRouter from './routes/addressRoutes.js';
import adminRouter from './routes/adminRuotes.js';
import deliveryPartnerRouter from './routes/deliveryPartnerRoutes.js';
import { stripeWebhooks } from './controllers/webhooks.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

app.post(
  '/api/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhooks,
);
// Middleware
app.use(cors());

// Ricostruzione di __dirname per gli ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Aggiungi questa riga nel file principale del server:
app.use(
  '/images',
  express.static(path.join(__dirname, '../client/public/images')),
);

const port = process.env.PORT || 5000;

app.get('/', (req: Request, res: Response) => {
  res.send('Server is live!');
});

app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/orders', orderRouter);
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/addresses', addressRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/delivery-partners', deliveryPartnerRouter);
app.use('/api/delivery', deliveryPartnerRouter);

// Error handling
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: error.message });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
