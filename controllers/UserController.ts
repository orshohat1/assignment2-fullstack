import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User"; // Import the User model
import { validationResult } from "express-validator";

const SECRET = "your_jwt_secret"; // Store in an environment variable for security

class UserController {
  
    // Sign up
  static async signUp(req: Request, res: Response): Promise<Response> {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const { firstName, lastName, email, userName, password } = req.body;

    // Check if the email or username already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    const existingUserName = await User.findOne({ userName });
    if (existingUserName) {
      return res.status(400).json({ error: "Username is already in use" });
    }

    try {
      // Hash password before saving user
      const hashedPassword = bcrypt.hashSync(password, 5);
      
      const newUser = new User({
        firstName,
        lastName,
        email,
        userName,
        password: hashedPassword,
      });

      // Save user to DB
      await newUser.save();

      // Generate JWT token
      const accessToken = jwt.sign(
        { userId: newUser.id|| "user" }, // Assuming a default role
        SECRET
      );

      // Send response with user data and access token
      return res.status(201).json({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        userName: newUser.userName,
        accessToken,
      });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  }

  // Login
  static async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Compare password
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid password!" });
      }

      // Generate JWT token
      const accessToken = jwt.sign(
        { userId: user.id|| "user" }, // Assuming a default role
        SECRET
      );

      // Send response with user data and access token
      return res.status(200).json({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userName: user.userName,
        accessToken,
      });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  }
}

export default UserController;
