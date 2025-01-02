import express from "express";
import CommentController from "../controllers/CommentController";
import verifyToken from "../middleware/verifyToken";
const router = express.Router();

router.get("/postComments/:postId", CommentController.getAllPostComments);

router.get("/:id", CommentController.getCommentById);

router.post("/post/:postId/:author", verifyToken, CommentController.createComment);

router.put("/:id", verifyToken, CommentController.editComment);

router.delete("/:id", verifyToken, CommentController.deleteComment);

export default router;