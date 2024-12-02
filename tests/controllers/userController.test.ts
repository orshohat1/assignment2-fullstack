import request from "supertest";
import app from "../../server"; 
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../models/User";

jest.mock("../../models/User");

describe('UserController', () => {
  let accessToken: string;
  const mockUser = {
    _id: '12345',
    firstName: 'John',
    lastName: 'Doe',
    email: 'testuser@example.com',
    userName: 'testuser',
    password: bcrypt.hashSync('password123', 5),  // Pre-hashed password for test
  };

  beforeAll(() => {
    // Mock User.findOne method to return null (no existing user)
    (User.findOne as jest.Mock).mockResolvedValue(null);  // No user exists for signup
    // Mock User.create method to return the mock user upon successful creation
    (User.create as jest.Mock).mockResolvedValue({
      ...mockUser,
      save: jest.fn(),
    });

    // Generate an access token for testing
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

    expect(response.status).toBe(201); // Check that the response status is 201 Created
  });

  // Test for invalid email during signup (already used email)
  it('should return an error if email is already in use', async () => {
    (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser); // Mock to simulate existing user with the same email
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
    (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser); // Mock to simulate existing user with the same username
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

  // Test Login route
  it('should log in an existing user with correct credentials', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser); // Mocking user found in DB

    const response = await request(app)
      .post('/users/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200); // Should log in successfully
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('firstName', 'John');
    expect(response.body).toHaveProperty('lastName', 'Doe');
  });

  // Test for invalid login credentials (wrong password)
  it('should return an error for invalid login credentials', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser); // Mocking user found in DB

    const response = await request(app)
      .post('/users/login')
      .send({
        email: 'testuser@example.com',
        password: 'wrongpassword', // Invalid password
      });

    expect(response.status).toBe(401); // Unauthorized
    expect(response.body).toHaveProperty('message', 'Invalid password/email!');
  });

  // Test Logout route
  it('should log out a user', async () => {
    const response = await request(app)
      .post('/users/logout')
      .set('Authorization', `Bearer ${accessToken}`); // Send the valid token

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Logout successful');
  });

  // Test for missing token on logout
  it('should return an error when no token is provided for logout', async () => {
    const response = await request(app)
      .post('/users/logout'); // No token provided

    expect(response.status).toBe(403);
  });
});
