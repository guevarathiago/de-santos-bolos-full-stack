import express, { type Request, type Response } from 'express';
import { connection } from './src/db.js';
import cors from 'cors';
import { router } from './src/routes.js';

const app = express();
app.use(express.json());
app.use(cors());
app.use(router);

connection();

app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});