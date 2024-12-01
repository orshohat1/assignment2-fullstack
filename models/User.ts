import mongoose, { Schema, Document, Model } from "mongoose";

interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    userName: string;
    password: string;
}

const UserSchema: Schema<IUser> = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;