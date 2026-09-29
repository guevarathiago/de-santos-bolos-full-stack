import express, { type Request, type Response } from 'express';
import { connection } from './src/db.js';
import { prisma } from './src/db.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
connection();

app.post('/login', async(req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const user = await prisma.user.findFirst({
            where: { email, password },
            select: { id: true, name: true, email: true }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        return res.json({ user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }

});

app.post('/register', async(req: Request, res: Response) => {
    try {
        const { name, email, password, celular, cep } = req.body;

        if (!name || !email || !password || !celular || !cep) {
            return res.status(400).json({ message: 'Name, email, password, celular and cep are required' });
        }

        const newUser = await prisma.user.create({
            data: { name, email, password, celular, cep },
            select: { id: true, name: true, email: true }
        });

        return res.status(201).json({ user: newUser });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(3000, () => {
    
    console.log(`Server is running on port 3000`);
});