import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcrypt";


// get admin dashboard data
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    // 1. Conta i record totali nelle varie tabelle
    const totalOrders = await prisma.order.count();
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    
    // Conta i prodotti esauriti
    const outOfStock = await prisma.product.count({
      where: { stock: 0 }
    });

    // 2. Recupera gli ordini recenti INCLUDENDO l'utente (🟢 FONDAMENTALE)
    const recentOrders = await prisma.order.findMany({
      take: 5, // Prendi gli ultimi 5
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // 3. Invia la risposta strutturata esattamente come richiesto dall'interfaccia Stats
    return res.json({
      totalOrders,
      totalUsers,
      totalProducts,
      outOfStock,
      recentOrders
    });

  } catch (error: any) {
    console.error("Errore nelle statistiche admin:", error);
    return res.status(500).json({ message: error.message });
  }
};
// get delivery partners list for admin
export const getDeliveryPartners = async (req: Request, res: Response ) => {
    const partners = await prisma.deliveryPartner.findMany({
        orderBy: {createdAt: "desc"}
    })
    res.json({partners});
}
// create delivery partner profile
export const createDeliveryPartner  = async (req: Request, res: Response ) => {
    const {name, email, password, phone, vehicleType} = req.body;

    if (!name || !email || !password || !phone) {
        res.status(400).json({message: "Please provide all required fields"})
        return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const partner = await prisma.deliveryPartner.create({
        data: {name, email: email.toLowerCase(),
             password: hashedPassword,
              phone,
               vehicleType}
    })
    res.status(201).json({partner})
}

// update delivery partner
export const updateDeliveryPartner = async (req: Request, res: Response ) => {
    const {name, phone, vehicleType, isActive} = req.body;
    const data: any = {};

    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (vehicleType) data.vehicleType = vehicleType;
    if (isActive) data.isActive = isActive;

    try {
        const partner =await prisma.deliveryPartner.update({
            where: {id: req.params.id as string},
            data
        })
        res.json({partner});
    } catch (error) {
        res.status(404).json({message: "Partner not found"});
    }
}
// assign del partner
export const assignDeliveryPartner = async (req: Request, res: Response ) => {
    const {partnerId} = req.body;

    const order = await prisma.order.findUnique({
        where: {id: req.params.id as string}
    })

    const partner = await prisma.deliveryPartner.findUnique({
        where: {id: partnerId}
    })

    //generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    let status = order!.status;
    const history: any[] = Array.isArray(order!.statusHistory) ? 
    order!.statusHistory : [];

    if (order!.status === "Placed" || order!.status === "Confirmed") {
        status = "Assigned";
        history.push({
            status: "Assigned",
            note: `Assigned to ${partner!.name}`, timeStamp: new Date() 
        })
    }

    await prisma.order.update({
        where: {id: order!.id},
        data: {deliveryPartnerId: partner!.id, deliveryOtp: otp, status,
            statusHistory: history
        }
    })
    res.json({order});
}