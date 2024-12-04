import express from "express";
import { check } from "express-validator";
import UserController from "../controllers/UserController";
import verifyToken from "../middleware/verifyToken";

const router = express.Router();

// Register a new user
router.post(
  "/signup",
  [
    check("firstName").notEmpty().withMessage("First name is required"),
    check("lastName").notEmpty().withMessage("Last name is required"),
    check("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
    check("userName").notEmpty().withMessage("Username is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  UserController.signUp
);

// Login
router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  UserController.login
);

// Logout
router.post("/logout", verifyToken, UserController.logout);

export default router;
