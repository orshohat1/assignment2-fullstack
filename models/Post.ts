import mongoose, { Schema, Document, Model } from "mongoose";

interface IPost extends Document {
    title: string;
    content: string;
    author: string;
}

const PostSchema: Schema<IPost> = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true,
    },
});

const Post: Model<IPost> = mongoose.model<IPost>("Post", PostSchema);
export default Post;
