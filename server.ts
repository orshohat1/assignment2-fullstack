import express from 'express';
import { connectDb } from './mongodb';
import PostRouter from './routers/postRouter';
import UserRouter from './routers/userRouter';

const PORT = 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/posts', PostRouter);
app.use('/users', UserRouter);

export default app;

export async function startServer(port = PORT) {
    await connectDb();
    return app.listen(port, () => console.log(`Server is up at ${port}`));
}

if (require.main === module) {
    (async () => {
        await startServer(PORT);
    })();
}