import express from 'express';
import auth from '../middleware/auth.js';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

const uploadRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

uploadRouter.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // 🟢 FIX CRITICO: Sostituito l'ultimo ';' con ',' prima del b64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Caricamento su Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'supermercato',
      resource_type: 'auto',
    });

    return res.json({ url: result.secure_url });
  } catch (error: any) {
    // 🟢 Stampiamo l'errore nel terminale del backend così vedi la causa esatta (es. credenziali Cloudinary errate)
    console.error("❌ Errore durante l'upload su Cloudinary:", error);
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
});

export default uploadRouter;