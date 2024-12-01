import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Post from "../models/Post";
import User from "../models/User"; // Import User model to validate author

class PostController {

    // Add a new post
    static async addPost(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { title, content } = req.body;
        const { authorId } = req.query; // Get authorId from query

        // Validate if the author exists in the database
        const user = await User.findById(authorId);
        if (!user) {
            res.status(400).json({ error: "Invalid author ID" });
            return;
        }

        try {
            const post = new Post({ title, content, author: authorId });
            await post.save();
            res.status(201).json(post);
        } catch (err) {
            res.status(500).json({ error: "Server error" });
        }
    }

    // Get posts (all or by sender)
    static async getPosts(req: Request, res: Response): Promise<void> {
        const sender = req.query.sender as string | undefined;

        try {
            const filter = sender ? { author: sender } : {};
            const posts = await Post.find(filter).populate("author", "firstName lastName email");

            if (sender && posts.length === 0) {
                res.status(404).json({ message: `No posts found for user ID: ${sender}` });
                return;
            }

            res.status(200).json(posts);
        } catch (err) {
            res.status(500).json({ error: "Server error" });
        }
    }

    // Get a post by ID
    static async getPostById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const post = await Post.findById(id).populate("author", "firstName lastName email");
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            res.status(200).json(post);
        } catch (err) {
            res.status(500).json({ error: "Server error" });
        }
    }

    // Update post
    // Update post
    static async updatePost(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { id } = req.params;
        const { title, content } = req.body;
        const { authorId } = req.query; // Get authorId from query

        // Validate if the author exists in the database
        if (authorId) {
            const user = await User.findById(authorId);
            if (!user) {
                res.status(400).json({ error: "Invalid author ID" });
                return;
            }
        }

        try {
            const post = await Post.findByIdAndUpdate(
                id,
                { title, content, author: authorId },
                { new: true, runValidators: true }
            ).populate("author", "firstName lastName email");

            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            res.status(200).json(post);
        } catch (err) {
            res.status(500).json({ error: "Server error" });
        }
    }

    // Delete post
    static async deletePost(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;

        try {
            const post = await Post.findByIdAndDelete(id);

            if (!post) {
                return res.status(404).json({ error: "Post not found" });
            }

            return res.status(200).json({ message: "Post deleted successfully" });
        } catch (err) {
            return res.status(500).json({ error: "Server error" });
        }
    }
}

export default PostController;