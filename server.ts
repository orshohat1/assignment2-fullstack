// 208108712 Yehonatan Katz
// 209364769 Or Shohat

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import { connectDb } from './mongodb';
import PostRouter from './routers/postRouter';
import UserRouter from './routers/userRouter';
import CommentRouter from './routers/commentRouter';

const PORT = 3000;

const app: any = express();
const swaggerDocument = yaml.load('./swagger.yaml');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// routes
app.use('/posts', PostRouter);
app.use('/users', UserRouter);
app.use('/comments', CommentRouter);

export default app;

export async function startServer(port = PORT) {
    await connectDb();
    return app.listen(port, () => console.log(`Server is up at http://localhost:${port}`));
}

if (require.main === module) {
    (async () => {
        await startServer(PORT);
    })();
}
