import { connect, model } from 'mongoose';

const MONGODB_URL = 'mongodb://localhost:27017/assignement2_fullstack';

// run this when the server is starting
export async function connectDb() {
    await connect(MONGODB_URL);
}
