import { Router } from 'express';
import { login, register } from './controller/user-controler.js';

export const router = Router();

router.post('/login', login);
router.post('/register', register);