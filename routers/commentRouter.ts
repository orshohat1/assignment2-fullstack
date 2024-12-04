import express from "express";
const router = express.Router();
import CommentController from "../controllers/CommentController";
import verifyToken from "../middleware/verifyToken";

router.get("/postComments/:postId", CommentController.getAllPostComments);

router.get("/:id", CommentController.getCommentById);

router.post("/post/:postId", CommentController.createComment);

router.put("/:id", CommentController.editComment);

router.delete("/:id", CommentController.deleteComment);

module.exports = router;