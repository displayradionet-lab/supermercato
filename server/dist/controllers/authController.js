import { prisma } from '../config/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};
// check if user is admin
const getAdminStatus = (email) => {
    if (!email)
        return false;
    const adminEmails = process.env.ADMIN_EMAILS
        ? process.env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
        : [];
    return adminEmails.includes(email.toLowerCase());
};
// Register
// POST/api/auth/Register
export const register = async (req, res) => {
    const { name, email, pwd } = req.body;
    try {
        if (!name || !email || !pwd) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPwd = await bcrypt.hash(pwd, 10);
        const user = await prisma.user.create({
            data: { name, email: email.toLowerCase(), password: hashedPwd },
        });
        const token = generateToken(user.id);
        const userData = { ...user };
        delete userData.password;
        userData.isAdmin = getAdminStatus(userData.email);
        res.status(201).json({ user: userData, token });
    }
    catch (error) {
        console.log('error');
    }
};
// Login
// POST/api/auth/login
export const login = async (req, res) => {
    const { email, pwd } = req.body;
    try {
        if (!email || !pwd) {
            return res
                .status(400)
                .json({ message: 'Please provide email and password' });
        }
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { addresses: true },
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or pwd' });
        }
        const isMatch = await bcrypt.compare(pwd, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid pwd' });
        }
        const token = generateToken(user.id);
        const userData = { ...user };
        delete userData.pwd;
        userData.isAdmin = getAdminStatus(userData.email);
        res.json({ user: userData, token });
    }
    catch (error) { }
};
