import request from "supertest";
import app from "../../server";
import mongoose from "mongoose";
import Post from "../../models/Post";
import User from "../../models/User";
import { connectDb } from "../../mongodb";

jest.mock("../../middleware/verifyToken", () => jest.fn((req, res, next) => next()));

describe("PostController", () => {
    let userId: string;
    let postId: string;

    beforeAll(async () => {
        await connectDb();

        // Create a test user
        const user = new User({
            firstName: "Test", lastName: "User", email: "test@example.com", userName: "testuser",
            password: "password123"
        });
        await user.save();
        userId = user._id.toString();
    });

    beforeEach(async () => {
        await connectDb();
    });


    afterAll(async () => {
        await Post.deleteMany({});
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    describe("POST /posts", () => {
        it("should create a new post", async () => {
            const response = await request(app)
                .post("/posts")
                .send({ title: "Test Post", content: "Test Content" })
                .query({ authorId: userId });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("title", "Test Post");
            expect(response.body).toHaveProperty("content", "Test Content");
            postId = response.body._id;
        });

        it("should return validation error for missing fields", async () => {
            const response = await request(app).post("/posts").send({}).query({ authorId: userId });

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe("GET /posts", () => {
        it("should retrieve all posts", async () => {
            const response = await request(app).get("/posts");

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it("should retrieve posts by author", async () => {
            const response = await request(app).get("/posts").query({ sender: userId });

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe("GET /posts/:id", () => {
        it("should retrieve a post by ID", async () => {
            const response = await request(app).get(`/posts/${postId}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("title", "Test Post");
        });

        it("should return 500 for invalid post ID", async () => {
            const response = await request(app).get(`/posts/invalidId123`);

            expect(response.status).toBe(500);
        });
    });

    describe("PUT /posts/:id", () => {
        it("should update a post by ID", async () => {
            const response = await request(app)
                .put(`/posts/${postId}`)
                .send({ title: "Updated Title" })
                .query({ authorId: userId });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("title", "Updated Title");
        });

        it("should return 500 for non-existent post ID", async () => {
            const response = await request(app).put(`/posts/invalidId123`).send({ title: "New Title" });

            expect(response.status).toBe(500);
        });
    });

    describe("DELETE /posts/:id", () => {
        it("should delete a post by ID", async () => {
            const response = await request(app).delete(`/posts/${postId}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("message", "Post deleted successfully");
        });

        it("should return 500 for non-existent post ID", async () => {
            const response = await request(app).delete(`/posts/invalidId123`);

            expect(response.status).toBe(500);
        });
    });
});
