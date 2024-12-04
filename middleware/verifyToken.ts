import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
const SECRET = "test";

const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.sendStatus(403);
    return;
  }

  // Extract the token after "Bearer"
  const token = authHeader.split(" ")[1];

  if (!token) {
    res.sendStatus(403);
    return;
  }

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      res.sendStatus(403);
    } else {
      next();
    }
  });
};

export default verifyToken;
