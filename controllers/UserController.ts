import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User"; // Import the User model
import { validationResult } from "express-validator";

const SECRET = "test";

class UserController {

  // Sign up
  static async signUp(req: Request, res: Response): Promise<void> {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      res.status(400).json({ errors: validationErrors.array() });
      return;
    }

    const { firstName, lastName, email, userName, password } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ error: "Email is already in use" });
      return;
    }

    const existingUserName = await User.findOne({ userName });
    if (existingUserName) {
      res.status(400).json({ error: "Username is already in use" });
      return;
    }

    try {
      const hashedPassword = bcrypt.hashSync(password, 5);

      const newUser = new User({
        firstName,
        lastName,
        email,
        userName,
        password: hashedPassword,
      });

      await newUser.save();

      const accessToken = jwt.sign(
        { userId: newUser.id || "user" }, // Assuming a default role
        SECRET
      );

      res.status(201).json({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        userName: newUser.userName,
        accessToken,
      });

    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }

  // Login
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      // Compare password
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, message: "Invalid password/email!" });
        return;
      }

      // Generate JWT token
      const accessToken = jwt.sign(
        { userId: user.id || "user" },
        SECRET
      );

      // Send response with user data and access token
      res.status(200).json({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userName: user.userName,
        accessToken,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }


  // Logout
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        res.status(403).json({ error: "Token is required for logout" });
        return;
      }
      res.status(200).json({ message: "Logout successful" });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }

}

export default UserController;
