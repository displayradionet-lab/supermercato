import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { inngest } from '../inngest/index.js';
import Stripe from "stripe"

// Create Order - POST /api/order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const productIds = items.map((i: any) => i.product);
    
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap: Record<string, (typeof products)[0]> = {};
    products.forEach((product) => {
      productMap[product.id] = product;
    });

    // Controllo preliminare dello stock
    for (const item of items) {
      const product = productMap[item.product];
      if (!product || (product.stock ?? 0) < item.quantity) {
        return res.status(404).json({ message: `Product ${product?.name || 'Unknown'} out of stock or not found` });
      }
    }

    const orderItems = items.map((item: any) => {
      const dbProduct = productMap[item.product];
      if (!dbProduct) throw new Error(`Product ${item.product} not found`);
      return {
        product: dbProduct.id,
        name: dbProduct.name,
        image: dbProduct.image,
        price: dbProduct.price,
        quantity: item.quantity,
        unit: dbProduct.unit,
      };
    });

    const subtotal = orderItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const deliveryFee = subtotal > 20 ? 0 : 1.99;
    const tax = Math.round(subtotal * 0.2 * 100) / 100;
    const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

    // Eseguiamo la creazione ordine e l'aggiornamento stock in una TRANSAZIONE atomica
    const order = await prisma.$transaction(async (tx) => {
      // 1. Scaliamo lo stock di tutti i prodotti controllando che non vadano sotto zero
      for (const item of orderItems) {
        const updatedProduct = await tx.product.updateMany({
          where: {
            id: item.product,
            stock: { gte: item.quantity } // Previene race conditions
          },
          data: {
            stock: { decrement: item.quantity }
          }
        });

        if (updatedProduct.count === 0) {
          throw new Error(`Concurrency error: ${item.name} went out of stock just now.`);
        }
      }

      // 2. Creiamo l'ordine
      return await tx.order.create({
        data: {
          userId: req.user!.id,
          items: orderItems,
          shippingAddress,
          paymentMethod,
          subtotal,
          deliveryFee,
          tax,
          total,
          statusHistory: [
            {
              status: 'Placed',
              note: 'Order Placed Successfully',
              timestamp: new Date(),
            },
          ],
        },
      });
    });

    if (paymentMethod === 'card') {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string); 

  // creiamo la sessione
const session = await stripe.checkout.sessions.create({
  success_url: `${req.headers.origin}/orders?clearCart=true`,
  cancel_url: `${req.headers.origin}/checkout`,
  line_items: [
    {
      price_data: {
        currency: "USD",
        product_data: {
          name: "Payment Groceries"
        },
        unit_amount: Math.round(total * 100)
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  metadata: {orderId: order.id}
});
return res.json({url: session.url})

    }
    res.json({order})

    // Decrease stock
    for(const item of orderItems){
      await prisma.product.update({
        where: {id: item.product},
        data: {stock: {decrement: item.quantity}}
      })
    }

    // Send stock update events for each product in the order
    // for(const item of orderItems){
    //   await inngest.send({name: "inventory/stock.updated", data: {
    //     productId: item.product
    //   }})
    // }

    // MANDIAMO I COLPETTI A INNGEST IN PARALLELO per non rallentare la risposta
    // Nota: Ottimizza Inngest muovendo il decremento stock lì se preferisci un approccio totalmente event-driven
    const inngestEvents = orderItems.map((item: any) => 
      inngest.send({ name: "inventory/stock.updated", data: { productId: item.product } })
    );
    inngestEvents.push(inngest.send({ name: "order/placed", data: { orderId: order.id } }));
    
    // Spara gli eventi in background senza bloccare il client
    Promise.all(inngestEvents).catch(err => console.error("Inngest error:", err));

    return res.status(201).json({ order });

  } catch (error: any) {
    console.error("Errore creazione ordine:", error);
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

// Get user's orders - GET /api/orders
export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const userId = req.user!.id;

    const where: any = { userId };
    if (status && status !== 'all' && status !== '') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: { deliveryPartner: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ orders });
  } catch (error: any) {
    console.error("Errore durante il fetch:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get single order - GET /api/order/:id 
export const getOrder = async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { deliveryPartner: { select: { name: true, phone: true, avatar: true, vehicleType: true } } }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json({ order });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Update order status - PUT /api/orders/:id/status 
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const orderId = req.params.id;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const history = (Array.isArray(order.statusHistory) ? order.statusHistory : []) as any[];
    history.push({ status, note: note || `Order ${status.toLowerCase()}`, timestamp: new Date() }); // Corretto typo timeStamp -> timestamp per coerenza

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status, statusHistory: history }
    });

    return res.json({ order: updatedOrder });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all orders for admin - GET /api/orders/all 
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { NOT: [{ paymentMethod: "card", isPaid: false }] },
      include: { 
        user: { select: { name: true, email: true } }, 
        deliveryPartner: { select: { name: true, phone: true, email: true } } 
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ orders });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get order location - GET /api/orders/:id/location 
export const getOrderLocation = async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      select: { liveLocation: true, status: true }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json({ liveLocation: order.liveLocation, status: order.status });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};