import "dotenv/config";
import express from 'express';
import cors from 'cors';
import authRouter from "./routes/authRoutes.js";
import productRouter from "./routes/productRoute.js";
import uploadRouter from "./routes/uploadRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
const app = express();
// Middleware
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;
app.get('/', (req, res) => {
    res.send('Server is live!');
});
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/orders', orderRouter);
// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));
// Error handling
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: error.message });
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
