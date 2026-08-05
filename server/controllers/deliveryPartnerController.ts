import { Request, Response, response } from 'express';
import { prisma } from '../config/prisma.js';
import bcrypt from 'bcrypt';
import  jwt  from 'jsonwebtoken';



const generateToken = (id: string)=>{
    return jwt.sign({id, role: "delivery"}, process.env.JWT_SECRET as string,
        {expiresIn: "30d"}
    )
}

// Login Delivery partner
// POST /api/delivery/Login
export const loginPartner = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Please provide email and pwd' });
  }

  const partner = await prisma.deliveryPartner.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });

  if (!partner) {
    return res.status(400).json({ message: 'Invalid email and pwd' });
  }

  if (!partner.isActive) {
    return res
      .status(403)
      .json({ message: 'Your account has been deactivated' });
  }

  const isMatch = await bcrypt.compare(password, partner.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or pwd' });
  }
  const token = generateToken(partner.id);
  const {password: _, ...partnerData} = partner;

  res.json({partner: partnerData, token})

};
// togglePartnerStatus 
export const togglePartnerStatus = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { isActive } = req.body; // Riceve true/false inviato dal frontend

    const updatedPartner = await prisma.deliveryPartner.update({
      where: { id },
      data: { 
        isActive: isActive 
      },
    });

    // Risponde al frontend confermando l'avvenuto cambio
    res.json({ message: 'Partner status updated successfully', updatedPartner });
  } catch (error: any) {
    console.error("Errore aggiornamento partner:", error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

// Get assigned deliveries GET/api/delivery/my-deliveries
export const getMyDeliveries = async (req: Request, res: Response) => {
    const {status} = req.query;
    const where: any = {deliveryPartnerId : req.partner!.id};

    if (status === "active") {
        where.status = {in: ["Assigned", "Packed", "Out of Delivery"]}
    } else if (status === "completed") {
        where.status = {in: ["Delivered", "Cancelled"]}
    }

    const orders = await prisma.order.findMany({
        where,
        include: {user: {select: {name: true, email: true, phone: true}}},
        orderBy: {createdAt: "desc"}
    })
    res.json({orders});
} 
// get single delivery detail - GET/api/delivery/my-deliveries/:id
export const getDeliveryDetail = async (req: Request, res: Response) => {
    const order = await prisma.order.findFirst({
        where: {id: req.params.id as string, deliveryPartnerId: req.partner!.id},
        include: {user: {select: {name: true, email: true, phone: true}}}
    })

    if (!order) {
        return res.status(404).json({message: "Delivery not found"});
    }
    res.json({order});
}

// Complete del with OTP - PUT /api/delivery/my-deliveries/:id/complete 
export const completeDelivery = async (req: Request, res: Response) => {
const {otp} = req.body;
const order = await prisma.order.findFirst({
    where: {id: req.params.id as string, deliveryPartnerId: req.partner!.id}
})

if (!order || order.status === "Cancelled" || order.status === "Delivered") {
    return res.status(400).json({message: "Invalid request"});
}

if (order.deliveryOtp !== otp) {
    return res.status(500).json({message: "Invalid OTP"});
}

const history = order.statusHistory as any[];

history.push({status: 'Delivery', note: "Delivered by partner", timeStamp: new Date()});

const updatedOrder = await prisma.order.update({
    where: {id: order.id},
    data: {status: "Delivered", statusHistory: history, deliveryOtp: ""}
})

res.json({order: updatedOrder, message: "Delivery completed Successfully"})
}
// Cancel delivery - PUT 

export const cancelDelivery = async (req: Request, res: Response) => {
    const {reason } = req.body;
    const order = await prisma.order.findFirst({
         where: {id: req.params.id as string, deliveryPartnerId: req.partner!.id}
    })

    if (order!.status === "Delivered") {
        return res.status(400).json({message: "Cannot cancel delivered order"});
    }

    const history = order!.statusHistory as any[];

    history.push({status: 'Cancelled', note: reason || "", timeStamp: new Date()})

    const updatedOrder =await prisma.order.update({
        where: {id: order!.id},
        data: {status: "Cancelled", statusHistory: history}
    })

    res.json({order: updatedOrder, message: "Delivery cancelled"});
}

// Update order status - PUT /api/delivery/my-deliveries/:id/status 
export const updateDeliveryStatus = async (req: Request, res: Response) => {
    // 🔍 STAMPA QUESTO NEL TERMINALE DEL BACKEND:
    console.log("--- CONTROLLO ID RICEVUTI ---");
    console.log("ID ricevuto nel parametro (req.params.id):", req.params.id);
    console.log("Stato ricevuto nel body (req.body.status):", req.body.status);
    console.log("-----------------------------");
    try {
         const {status} = req.body;
    const allowedStatus = ["Packed", "Out of Delivery"];

    if(!allowedStatus.includes(status)){
        return res.status(400).json({message: "Invalid status update"});
    }

  //  ESTRAZIONE BLINDATA: Leggiamo esattamente quello che inserisce il tuo middleware
    const currentPartner = (req as any).partner;
    const partnerId = currentPartner?.id;

    if (!partnerId) {
      return res.status(401).json({ message: "Unauthorized: Partner credentials not found" });
    }

    // ordine corrispondente
    const order = await prisma.order.findFirst({
         where: {id: req.params.id as string, deliveryPartnerId: partnerId}
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found or not assigned to this partner" });
    }

    // Gestione json history
    let history: any[] = [];

    if (order.statusHistory) {
      if (Array.isArray(order.statusHistory)) {
        history = order.statusHistory;
      } else if (typeof order.statusHistory === 'string') {
        // Nel caso in cui nel DB sia salvato come stringa JSON
        history = JSON.parse(order.statusHistory);
      }
    }

    // aggiungiamo nuovo record alla cronologia
    history.push({status, note: `Status updated to ${status}`, timeStamp: new Date()});

        const updatedOrder = await prisma.order.update({
        where: {id: order!.id},
        data: {status, statusHistory: history}
    })
    res.json({order: updatedOrder});
    } catch (error: any) {
        console.error("❌ Errore interno nel controller di update:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
    }
   

}
// update live location - PUT 
export const updateLocation = async (req: Request, res: Response) => {
    const {lat, lng} = req.body;

      const order = await prisma.order.findFirst({
         where: {id: req.params.id as string, deliveryPartnerId: req.partner!.id,
            status: {in: ['Assigned', 'Packed', 'Out of Delivery']}
         }
    })
    await prisma.order.update({
        where: {id: order!.id},
        data: {liveLocation: {lat, lng, updatedAt: new Date()}}
    })
    res.json({success: true});
}
