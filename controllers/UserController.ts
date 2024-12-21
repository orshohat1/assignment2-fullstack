import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { validationResult } from "express-validator";
import { isValidObjectId } from "mongoose";
import User from "../models/User";

const SECRET = "test";

interface TokenPayload extends JwtPayload {
  userId: string;
}

class UserController {

  // create user (signup)
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
        { userId: newUser.id || "user" },
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

  // update user by id
  static async updateUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.id;
    const updates = req.body;

    if (!userId || !updates || Object.keys(updates).length === 0) {
      res.status(400).json({ error: "must provide a valid user ID and fields to update" });
      return;
    }

    if (updates.password) {
      const hashedPassword = bcrypt.hashSync(updates.password, 5);
      updates.password = hashedPassword;
    }
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (err) {
      res.status(500).json({ error: "An error occurred while updating the user" });
    }
  }

  // get user by id
  static async getUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.id;

    if (!userId) {
      res.status(400).json({ error: "must pass userId" });
      return;
    }

    try {
      const user = await User.findById(
        userId
      );

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.status(200).json({ message: "User found!", user: user });
    } catch (err) {
      res.status(500).json({ error: "An error occurred" });
    }
  }

  // delete user by id
  static async deleteUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.id;

    if (!userId) {
      res.status(400).json({ error: "must pass userId" });
      return;
    }

    if (!isValidObjectId(userId)) {
      res.status(400).json({ error: "User not found" });
      return;
    }

    try {
      const user = await User.findByIdAndDelete(
        userId
      );

      res.status(200).json({ message: "User deleted!", user: user });
    } catch (err) {
      res.status(500).json({ error: "An error occurred" });
    }
  }

  // login
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, message: "Invalid password/email!" });
        return;
      }

      const accessToken = jwt.sign(
        { userId: user.id || "user" },
        SECRET,
        { expiresIn: "1h" }
      );

      const refreshToken = jwt.sign(
        { userId: user.id || "user" },
        SECRET,
        { expiresIn: "7d" }
      );

      if (refreshToken) {
        user.refreshTokens?.push(refreshToken)
      }
      await user.save(); // save the refresh token in user object

      res.status(200).json({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userName: user.userName,
        accessToken: accessToken,
        refreshToken: refreshToken
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }


  // logout
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // refresh token
      const refreshToken = req.body.refreshToken;
      if (!refreshToken) {
        res.status(400).json({ message: "Refresh token not found" });
        return;
      }
      const decoded = jwt.verify(refreshToken, SECRET) as TokenPayload;
      if (!decoded) {
        res.status(400).json({ error: "Invalid decoded" });
        return;
      }

      const user = await User.findOne({ _id: decoded.userId });
      if (!user) {
        res.status(400).json({ message: "Invalid refresh token" });
        return;
      }

      // If refreshTokens list doesn't include 'refreshToken', we clear the list (maybe a breach)
      if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
        user.refreshTokens = [];
        await user.save();
        res.status(400).json({ message: "Invalid refresh token" });
        return;
      }

      // remove 'refreshToken' from refreshTokens list 
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken) || [];
      await user.save();

      const accessToken = req.header("Authorization")?.replace("Bearer ", "");
      if (!accessToken) {
        res.status(403).json({ error: "Access token is required for logout" });
        return;
      }
      res.status(200).json({ message: "Logout successful" });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }

}

export default UserController;
