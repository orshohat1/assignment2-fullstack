import request from "supertest";
import app from "../../server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/User";

jest.mock("../../models/User");

describe('UserController', () => {
  let accessToken: string;
  const mockUser = {
    _id: '67530ccde226e97f7d2dc3a5',
    firstName: 'John',
    lastName: 'Doe',
    email: 'testuser@example.com',
    userName: 'testuser',
    password: bcrypt.hashSync('password123', 5),
    refreshTokens: [],
    save: jest.fn().mockResolvedValue(true),
  };

  beforeAll(() => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (User.create as jest.Mock).mockResolvedValue({
      ...mockUser,
      save: jest.fn(),
    });

    accessToken = jwt.sign({ userId: mockUser._id }, "test");
  });

  // Test SignUp route
  it('should sign up a new user', async () => {
    const response = await request(app)
      .post('/users/signup')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'testuser@example.com',
        userName: 'testuser',
        password: 'password123',
      });

    expect(response.status).toBe(201);
  });

  // Test for invalid email during signup (already used email)
  it('should return an error if email is already in use', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
    const response = await request(app)
      .post('/users/signup')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'testuser@example.com', // This email is already taken
        userName: 'janedoe',
        password: 'password123',
      });

    expect(response.status).toBe(400);
  });

  // Test for invalid username during signup (already used username)
  it('should return an error if username is already in use', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
    const response = await request(app)
      .post('/users/signup')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'janedoe@example.com',
        userName: 'testuser', // This username is already taken
        password: 'password123',
      });

    expect(response.status).toBe(400);
  });

  it("should update a user by ID", async () => {
    const updatedUser = { ...mockUser, firstName: "updated newfirstname" };

    (User.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(updatedUser);

    const response = await request(app)
      .put(`/users/${mockUser._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ firstName: "updated newfirstname" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "User updated successfully");
    expect(response.body.user).toHaveProperty("firstName", "updated newfirstname");
  });

  it("shouldn't update a user because body is empty", async () => {
    const updatedUser = { ...mockUser, firstName: "updated newfirstname" };

    (User.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(updatedUser);

    const response = await request(app) // body is empty
      .put(`/users/${mockUser._id}`)
      .set("Authorization", `Bearer ${accessToken}`);


    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "must provide a valid user ID and fields to update");
  });


  it("should hash the password when updating user with a new password", async () => {
    const newPassword = "password123456";
    const hashedPassword = "mockedHashedPassword";

    jest.spyOn(bcrypt, "hashSync").mockReturnValue(hashedPassword);

    const updatedUser = { ...mockUser, password: hashedPassword };
    (User.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(updatedUser);

    const response = await request(app)
      .put(`/users/${mockUser._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ password: newPassword });

    expect(response.status).toBe(200);
    expect(bcrypt.hashSync).toHaveBeenCalledWith(newPassword, 5);
    expect(response.body).toHaveProperty("message", "User updated successfully");
  });

  it("should get a user by ID", async () => {
    (User.findById as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app).get(`/users/${mockUser._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "User found!");
    expect(response.body.user).toHaveProperty("firstName", mockUser.firstName);
    expect(response.body.user).toHaveProperty("lastName", mockUser.lastName);
    expect(response.body.user).toHaveProperty("email", mockUser.email);
    expect(response.body.user).toHaveProperty("userName", mockUser.userName);
  });

  it("should return an error if user is not found", async () => {
    (User.findById as jest.Mock).mockResolvedValue(null);

    const response = await request(app).get(`/users/${mockUser._id}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error", "User not found");
  });

  it("should delete a user by ID", async () => {
    (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app).delete(`/users/${mockUser._id}`).set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "User deleted!");
    expect(response.body.user).toHaveProperty("_id", mockUser._id);
    expect(response.body.user).toHaveProperty("firstName", mockUser.firstName);
    expect(response.body.user).toHaveProperty("lastName", mockUser.lastName);
  });

  it("should return an error if the user is not found", async () => {
    (User.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    const response = await request(app).delete(`/users/inValidId`).set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "User not found");
  });

  // Test Login route
  it('should log in an existing user with correct credentials', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/users/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('firstName', 'John');
    expect(response.body).toHaveProperty('lastName', 'Doe');
  });

  // Test for invalid login credentials (wrong password)
  it('should return an error for invalid login credentials', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/users/login')
      .send({
        email: 'testuser@example.com',
        password: 'wrongpassword', // Invalid password
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid password/email!');
  });

  // Test Logout route
  it('should log out a user', async () => {

    const myRefreshToken = jwt.sign(
      { userId: "123" },
      "test",
      { expiresIn: "7d" }
    );

    const mockUserLogout = {
      _id: '67530ccde226e97f7d2dc3a5',
      firstName: 'John',
      lastName: 'Doe',
      email: 'testuser@example.com',
      userName: 'testuser',
      password: bcrypt.hashSync('password123', 5),
      refreshTokens: [myRefreshToken],
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne = jest.fn().mockResolvedValue(mockUserLogout);

    const response = await request(app)
      .post('/users/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: myRefreshToken });

    expect(response.status).toBe(200);
    expect(mockUserLogout.refreshTokens).toHaveLength(0);
    expect(response.body).toHaveProperty('message', 'Logout successful');
  });

  // Test for missing token on logout
  it('should return an error when no token is provided for logout', async () => {
    const response = await request(app)
      .post('/users/logout');

    expect(response.status).toBe(403);
  });

  it('should return an 400 when no refresh token is found', async () => {
    const response = await request(app)
      .post('/users/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Refresh token not found');
  });

  // it should return 400 if user does not contain refresh token
  it('should return 400 if user does not contain refresh token', async () => {

    const myRefreshToken = jwt.sign(
      { userId: "123" },
      "test",
      { expiresIn: "7d" }
    );

    const mockUserNoRefreshToken = {
      _id: '67530ccde226e97f7d2dc3a5',
      firstName: 'John',
      lastName: 'Doe',
      email: 'testuser@example.com',
      userName: 'testuser',
      password: bcrypt.hashSync('password123', 5),
      refreshTokens: [],
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne = jest.fn().mockResolvedValue(mockUserNoRefreshToken);
    const response = await request(app)
      .post('/users/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: myRefreshToken });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid refresh token');
  });

  it("should return 500 if server error", async () => {
    const invalidRefreshToken = "invalidRefreshToken";

    const response = await request(app)
      .post("/users/logout")
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: invalidRefreshToken });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error", "Server error");
  });


  it('should return 200 with new access and refresh tokens', async () => {
    const myRefreshToken = jwt.sign(
      { userId: "123" },
      "test",
      { expiresIn: "7d" }
    );

    const mockUserRefresh = {
      _id: '67530ccde226e97f7d2dc3a5',
      firstName: 'John',
      lastName: 'Doe',
      email: 'testuser@example.com',
      userName: 'testuser',
      password: bcrypt.hashSync('password123', 5),
      refreshTokens: [myRefreshToken],
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne = jest.fn().mockResolvedValue(mockUserRefresh);

    const response = await request(app)
      .post('/users/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: myRefreshToken });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  it('should return 400 if refresh token is not in refreshTokens array in user', async () => {
    const myRefreshToken = jwt.sign(
      { userId: "123" },
      "test",
      { expiresIn: "7d" }
    );

    const mockUserNoRefreshToken = {
      _id: '67530ccde226e97f7d2dc3a5',
      firstName: 'John',
      lastName: 'Doe',
      email: 'testuser@example.com',
      userName: 'testuser',
      password: bcrypt.hashSync('password123', 5),
      refreshTokens: [],
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne = jest.fn().mockResolvedValue(mockUserNoRefreshToken);

    const response = await request(app)
      .post('/users/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: myRefreshToken });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Invalid token');
  });

  it('should return 500 server error', async () => {
    const notValidToken = "notvalidtoken";

    const mockUserNoRefreshToken = {
      _id: '67530ccde226e97f7d2dc3a5',
      firstName: 'John',
      lastName: 'Doe',
      email: 'testuser@example.com',
      userName: 'testuser',
      password: bcrypt.hashSync('password123', 5),
      refreshTokens: [notValidToken],
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne = jest.fn().mockResolvedValue(mockUserNoRefreshToken);

    const response = await request(app)
      .post('/users/refresh')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: notValidToken });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('message', 'Server error');
  });

});
