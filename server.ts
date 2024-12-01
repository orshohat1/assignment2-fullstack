import express from 'express';
import { connectDb } from './mongodb';
const PORT = 4000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))


startServer();

async function startServer() {
    await connectDb();
    app.listen(PORT, () => console.log(`Server is up at ${PORT}`));
}