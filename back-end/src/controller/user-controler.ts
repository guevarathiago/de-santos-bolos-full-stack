import type { Request, Response } from 'express';
import { prisma } from '../db.js';
import bcrypt from 'bcrypt';

export const login = async(req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await prisma.user.findFirst({
            where: { email }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const matchPassword = await bcrypt.compare(password, user?.password);
        
        if (!matchPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        return res.status(200).json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const register = async(req: Request, res: Response) => {
    try {
        const { name, email, password, celular, cep } = req.body;

        if (!name || !email || !password || !celular || !cep) {
            return res.status(400).json({ message: 'Name, email, password, celular and cep are required' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        
        const hash = await bcrypt.hash(password, 10);
        
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const newUser = await prisma.user.create({
            data: { name, email, password: hash, celular, cep },
            select: { id: true, name: true, email: true }
        });

        return res.status(201).json({ user: newUser });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}