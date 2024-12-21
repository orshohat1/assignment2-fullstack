import express from "express";
import { check } from "express-validator";
import UserController from "../controllers/UserController";
import verifyToken from "../middleware/verifyToken";

const router = express.Router();

// create user (signup)
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

// update user by id
router.put(
  "/:id",
  verifyToken,
  UserController.updateUser
);

// get user by id
router.get(
  "/:id",
  UserController.getUser
);

// delete user by id
router.delete(
  "/:id",
  verifyToken,
  UserController.deleteUser
);

// login
router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  UserController.login
);

// logout
router.post("/logout", verifyToken, UserController.logout);

router.post("/refresh", verifyToken, UserController.refresh);

export default router;
