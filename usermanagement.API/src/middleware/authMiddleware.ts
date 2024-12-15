// Import required dependencies from express and jsonwebtoken
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Import the JWT secret from configuration
import { JWT_SECRET } from "../config/config";

// Define the structure of JWT payload
interface JwtPayload {
  userId: string;
}

// Extend Express Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Middleware function for authentication
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extract the token from the "Authorization" header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authorization token is missing' });
      return; // Ensure the function exits after sending a response
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Attach the userId from the token payload to the request object
    req.userId = decoded.userId;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};
