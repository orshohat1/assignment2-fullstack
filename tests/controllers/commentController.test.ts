import request from "supertest";
import mongoose from "mongoose";
import app from "../../server";
import Comment from "../../models/Comment";
import Post from "../../models/Post";
import User from "../../models/User";
import { connectDb } from "../../mongodb";

// Mock data
const mockPostId = new mongoose.Types.ObjectId();
const mockAuthorId = new mongoose.Types.ObjectId();
const mockCommentId = new mongoose.Types.ObjectId();

// Set up the database connection before tests
beforeAll(async () => {
    await connectDb();

    await User.create({ _id: mockAuthorId, firstName: "John", lastName: "Doe", email: "johndoe@example.com", userName: "JohnD", password: "Aa123456" });
    await Post.create({ _id: mockPostId, title: "Test Post", content: "Post Content", author: mockAuthorId });
});

// Clean up after tests
afterAll(async () => {
    await Comment.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
});

describe("CommentController", () => {
    describe("POST /comments/post/:postId", () => {
        it("should create a new comment", async () => {
            const res = await request(app)
                .post(`/comments/post/${mockPostId}`)
                .send({
                    author: mockAuthorId,
                    content: "This is a test comment"
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("_id");
            expect(res.body.content).toBe("This is a test comment");
        });

        it("should return 400 for empty content", async () => {
            const res = await request(app)
                .post(`/comments/post/${mockPostId}`)
                .send({
                    author: mockAuthorId,
                    content: ""
                });

            expect(res.status).toBe(400);
            expect(res.text).toBe("comment is empty");
        });
    });

    describe("GET /comments/:id", () => {
        it("should get a comment by ID", async () => {
            const comment = await Comment.create({
                _id: mockCommentId,
                author: mockAuthorId,
                content: "Some comment",
                postId: mockPostId,
            });

            const res = await request(app).get(`/comments/${mockCommentId}`);

            expect(res.status).toBe(200);
            expect(res.body.comment.content).toBe("Some comment");
        });

        it("should return 400 for invalid comment ID", async () => {
            const res = await request(app).get(`/comments/invalidId`);

            expect(res.status).toBe(400);
            expect(res.text).toBe("Invalid Comment ID");
        });
    });

    describe("GET /comments/postComments/:postId", () => {
        it("should get all comments for a post", async () => {
            const res = await request(app).get(`/comments/postComments/${mockPostId}`);

            expect(res.status).toBe(200);
            expect(res.body.comments).toBeInstanceOf(Array);
        });

        it("should return 400 for invalid post ID", async () => {
            const res = await request(app).get(`/comments/postComments/invalidId`);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid Post ID");
        });
    });

    describe("PUT /comments/:id", () => {
        it("should update a comment", async () => {
            const res = await request(app)
                .put(`/comments/${mockCommentId}`)
                .send({
                    content: "Updated comment content",
                });

            expect(res.status).toBe(200);
            expect(res.body.updatedComment.content).toBe("Updated comment content");
        });

        it("should return 404 for non-existent comment", async () => {
            const res = await request(app)
                .put(`/comments/nonExistentId`)
                .send({
                    content: "Updated comment content",
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Invalid Comment ID");
        });
    });

    describe("DELETE /comments/:id", () => {
        it("should delete a comment", async () => {
            const res = await request(app).delete(`/comments/${mockCommentId}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("comment deleted successfully");
        });

        it("should return 400 for invalid comment ID", async () => {
            const res = await request(app).delete(`/comments/invalidId`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Invalid Comment ID");
        });
    });
});
