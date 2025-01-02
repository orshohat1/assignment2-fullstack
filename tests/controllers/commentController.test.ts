import request from "supertest";
import mongoose from "mongoose";
import app from "../../server";
import Comment from "../../models/Comment";
import Post from "../../models/Post";
import User from "../../models/User";
import { connectDb } from "../../mongodb";

jest.mock("../../middleware/verifyToken", () => jest.fn((req, res, next) => next()));

const mockPostId = new mongoose.Types.ObjectId();
const mockAuthorId = new mongoose.Types.ObjectId();
const mockCommentId = new mongoose.Types.ObjectId();

// database connection and creations
beforeAll(async () => {
    await connectDb();

    await User.create({ _id: mockAuthorId, firstName: "John", lastName: "Doe", email: "johndoe@example.com", userName: "JohnD", password: "Aa123456" });
    await Post.create({ _id: mockPostId, title: "Test Post", content: "Post Content", author: mockAuthorId });
});

// cleanup
afterAll(async () => {
    await Comment.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({});
    await mongoose.disconnect();
});

describe("CommentController", () => {
    // Helper function to generate valid postId and authorId
    const generateValidIds = () => ({
        postId: new mongoose.Types.ObjectId().toHexString(),
        author: new mongoose.Types.ObjectId().toHexString(),
    });

    it('should create a new comment', async () => {
        const { postId, author } = generateValidIds();
        const content = 'This is a test comment';

        const res = await request(app)
            .post(`/comments/post/${postId}/${author}`)
            .send({ content });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.content).toBe(content);
    });

    it('should return 400 for empty content', async () => {
        const { postId, author } = generateValidIds();

        const res = await request(app)
            .post(`/comments/post/${postId}/${author}`)
            .send({ content: '' });

        expect(res.status).toBe(400);
        expect(res.text).toBe('comment is empty');
    });

    it('should return 500 for error during comment creation (Database error)', async () => {
        const { postId, author } = generateValidIds();
        const content = 'This is a test comment';

        // Simulate a database error by mocking the save method
        jest.spyOn(Comment.prototype, 'save').mockRejectedValue(new Error('Database error'));

        const res = await request(app)
            .post(`/comments/post/${postId}/${author}`)
            .send({ content });

        expect(res.status).toBe(500);
        expect(res.text).toBe('Database error');
    });

    it('should return 400 for unknown error during comment creation', async () => {
        const { postId, author } = generateValidIds();

        // Simulate an unknown error
        jest.spyOn(Comment.prototype, 'save').mockRejectedValue(null);

        const res = await request(app)
            .post(`/comments/post/${postId}/${author}`)
            .send({ content: 'Valid content' });

        expect(res.status).toBe(400);
        expect(res.text).toBe('Bad request');
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

        it("should return 500 for error during comment retrieval", async () => {
            jest.spyOn(Comment, 'findById').mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app).get(`/comments/${mockCommentId}`);

            expect(res.status).toBe(500);
            expect(res.text).toBe("Database error");
        });

        it("should return 400 for unknown error during comment retrieval", async () => {
            jest.spyOn(Comment, 'findById').mockRejectedValueOnce({});

            const res = await request(app).get(`/comments/${mockCommentId}`);

            expect(res.status).toBe(400);
            expect(res.text).toBe("Bad request");
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

        it("should return 500 for error during comment retrieval (Error object)", async () => {
            jest.spyOn(Comment, 'find').mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app).get(`/comments/postComments/${mockPostId}`);

            expect(res.status).toBe(500);
            expect(res.text).toBe("Database error");
        });

        it("should return 400 for unknown error during comment retrieval (non-Error object)", async () => {
            jest.spyOn(Comment, 'find').mockRejectedValueOnce({});

            const res = await request(app).get(`/comments/postComments/${mockPostId}`);

            expect(res.status).toBe(400);
            expect(res.text).toBe("Bad request");
        });
    });

    describe("PUT /comments/:id", () => {
        let mockCommentId: mongoose.Types.ObjectId;

        // Define the beforeEach hook at the top level of the test suite
        beforeEach(async () => {
            mockCommentId = new mongoose.Types.ObjectId();
            // Create a comment for use in the tests
            await Comment.create({
                _id: mockCommentId,
                author: mockAuthorId,
                content: "Test comment content",
                postId: mockPostId,
            });
        });

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
            const nonExistentCommentId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/comments/${nonExistentCommentId}`)
                .send({
                    content: "Updated comment content",
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("comment not found");
        });

        it("should return 400 for empty content", async () => {
            const res = await request(app)
                .put(`/comments/${mockCommentId}`)
                .send({
                    content: "",
                });

            expect(res.status).toBe(400);
            expect(res.text).toBe("comment is empty");
        });

        it("should return 404 for invalid comment id format", async () => {
            const invalidCommentId = "invalid_id";
            const res = await request(app)
                .put(`/comments/${invalidCommentId}`)
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

        it("should return 404 for invalid comment ID", async () => {
            const res = await request(app).delete(`/comments/invalidId`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Invalid Comment ID");
        });

        it("should return 500 for Database errors)", async () => {
            jest.spyOn(Comment, "findByIdAndDelete").mockRejectedValueOnce(new Error("Database error"));

            const res = await request(app).delete(`/comments/${mockCommentId}`);

            expect(res.status).toBe(500);
            expect(res.text).toBe("Database error");
        });

        it("should return 400 for non-Error object", async () => {
            jest.spyOn(Comment, "findByIdAndDelete").mockRejectedValueOnce({});

            const res = await request(app).delete(`/comments/${mockCommentId}`);

            expect(res.status).toBe(400);
            expect(res.text).toBe("Bad request");
        });
    });
});
