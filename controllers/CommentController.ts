import Comment from "../models/Comment";
import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import { Request, Response } from "express";

class CommentController {
    static async createComment(req: Request, res: Response): Promise<void> {
        const { postId } = req.params;
        const { author, content } = req.body;

        if (!content || content.trim() === '') {
            res.status(400).send("comment is empty");
            return;
        }

        try {
            const comment = new Comment({ author, content, postId });
            await comment.save();
            res.status(201).send(comment);
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).send(err.message);
            } else {
                res.status(400).send("Bad request");
            }
        }
    };

    static async getCommentById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            res.status(400).send("Invalid Comment ID");
            return;
        }

        try {
            const comment = await Comment.findById(id);
            res.status(200).send({ comment });
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).send(err.message);
            } else {
                res.status(400).send("Bad request");
            }
        }
    };

    static async getAllPostComments(req: Request, res: Response): Promise<void> {
        const { postId } = req.params;

        if (!isValidObjectId(postId)) {
            res.status(400).json({ error: "Invalid Post ID" });
            return;
        }

        try {
            const comments = await Comment.find({ postId: postId });

            res.status(200).json({ comments });
        } catch (err) {
            if (err instanceof Error) {
                res.status(500).send(err.message);
            } else {
                res.status(500).send("Bad request");
            }
        }
    };

    static async editComment(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { content } = req.body;

        if (!isValidObjectId(id)) {
            res.status(404).json({ error: "Invalid Comment ID" });
            return;
        }

        if (!content || content.trim() === '') {
            res.status(400).send("comment is empty");
            return;
        }
        const comment = await Comment.findById(id);
        if (!comment) {
            res.status(404).json({ error: "comment not found" });
            return;
        }
        try {
            const newData = { author: comment.author, content: content, postId: comment.postId }
            const updatedComment = await Comment.findByIdAndUpdate(id, newData, { new: true });
            res.status(200).send({ message: "comment updated!", updatedComment });
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).send(err.message);
            } else {
                res.status(400).send("Bad request");
            }
        }
    };

    static async deleteComment(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            res.status(404).json({ error: "Invalid Comment ID" });
            return;
        }

        try {
            const comment = await Comment.findByIdAndDelete(id);
            res.status(200).send({ message: "comment deleted successfully", comment });
        } catch (err) {
            if (err instanceof Error) {
                res.status(400).send(err.message);
            } else {
                res.status(400).send("Bad request");
            }
        }
    };

}

export default CommentController;
