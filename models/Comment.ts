import mongoose, { Schema, Document, Model } from "mongoose";

interface IComment extends Document {
    author: Schema.Types.ObjectId;
    content: string;
    postId: Schema.Types.ObjectId;
}

const CommentSchema: Schema<IComment> = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
}, { timestamps: true });

const Comment: Model<IComment> = mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
