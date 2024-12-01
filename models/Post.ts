import mongoose, { Schema, Document, Model } from "mongoose";

interface IPost extends Document {
  title: string;
  content: string;
  author: Schema.Types.ObjectId;
}

const PostSchema: Schema<IPost> = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
}, { timestamps: true });

const Post: Model<IPost> = mongoose.model<IPost>("Post", PostSchema);

export default Post;
