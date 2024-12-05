import express from "express";
import { check } from "express-validator";
import CommentController from "../controllers/CommentController";
import verifyToken from "../middleware/verifyToken";
const router = express.Router();

router.get("/postComments/:postId", CommentController.getAllPostComments);

router.get("/:id", CommentController.getCommentById);

router.post("/post/:postId", CommentController.createComment);

router.put("/:id", CommentController.editComment);

router.delete("/:id", CommentController.deleteComment);

export default router;