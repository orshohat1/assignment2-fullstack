import express from "express";
import { check } from "express-validator";
import PostController from "../controllers/PostController";
import verifyToken from "../middleware/verifyToken";

const router = express.Router();

// Add a new post
router.post(
  "/",
  verifyToken,
  [
    check("title").notEmpty().isString().withMessage("Title must be a non-empty string."),
    check("content").notEmpty().isString().withMessage("Content must be a non-empty string."),
    check("author").notEmpty().isString().withMessage("Author must be a non-empty string."),
  ],
  PostController.addPost
);

// Get all posts or posts by author
router.get("/", PostController.getPosts);

// Get a single post by ID
router.get("/:id", PostController.getPostById);

// Update a post by ID
router.put(
  "/:id",
  verifyToken,
  [
    check("title").optional().notEmpty().isString().withMessage("Title must be a string."),
    check("content").optional().notEmpty().isString().withMessage("Content must be a string."),
    check("author").optional().notEmpty().isString().withMessage("Author must be a string."),
  ],
  PostController.updatePost
);

// DELETE: Delete a post by ID
router.delete("/:id", verifyToken, PostController.deletePost);

export default router;
