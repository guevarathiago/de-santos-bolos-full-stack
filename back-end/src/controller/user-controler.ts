import type { CookieOptions, Request, Response } from 'express';
import { prisma } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const TOKEN_MAX_AGE = 5 * 60 * 60 * 1000;

const cookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
};

type TokenPayload = {
    id: string;
    name: string;
    email: string;
};

const setAuthCookie = (res: Response, payload: TokenPayload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: TOKEN_MAX_AGE / 1000 });

    res.cookie('token', token, { ...cookieOptions, maxAge: TOKEN_MAX_AGE });
};

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

        const userInfo = { id: user.id, name: user.name, email: user.email };

        setAuthCookie(res, userInfo);

        return res.status(200).json({ message: 'Login successful', user: userInfo });

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

        setAuthCookie(res, newUser);

        return res.status(201).json({ user: newUser });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const auth = async(req: Request, res: Response) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'No token found' });
    }

    try {
        const { id, name, email } = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

        return res.status(200).json({ user: { id, name, email } });
    } catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

export const logout = (req: Request, res: Response) => {
    res.clearCookie('token', cookieOptions);

    return res.status(204).send();
}
