import { Router } from 'express';
import { login, register, auth, logout } from './controller/user-controler.js';

export const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', auth);
router.post('/logout', logout);