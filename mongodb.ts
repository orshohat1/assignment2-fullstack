import { connect, model } from 'mongoose';

const MONGODB_URL = 'mongodb://localhost:27017/assignement1_fullstack'; 

// run this when the server is starting
export async function connectDb() {
    console.log("Connected to the database");
    await connect(MONGODB_URL);
}
