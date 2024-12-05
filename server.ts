import express from 'express';
import { connectDb } from './mongodb';
import PostRouter from './routers/postRouter';
import UserRouter from './routers/userRouter';
import CommentRouter from './routers/commentRouter'

const PORT = 3000;

const app: any = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/posts', PostRouter);
app.use('/users', UserRouter);
app.use('/comments', CommentRouter);

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