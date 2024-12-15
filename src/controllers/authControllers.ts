import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/user";
import { JWT_SECRET } from "../config/config";
import { validateUser } from "../validations/userValidation";
import { IUser } from "../interfaces/userInterface";
import { v4 as uuidv4 } from "uuid";

class AuthController {
  // User Registration Handler
  public async register(req: Request, res: Response): Promise<any> {
    try {
      // Step 1: Validate user input data
      const { error, value: payload } = validateUser(req.body);
      if (error) {
        res
          .status(400)
          .json({ message: error.details.map((err) => err.message) });
        return;
      }

      const { email, password } = payload;

      // Step 2: Check for existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Step 3: Hash the password for security
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Step 4: Prepare user data with string _id
      const userData: IUser = {
        _id: uuidv4(),
        ...payload,
        password: hashedPassword,
      };

      // Step 5: Create and save new user
      const user = new User(userData);
      const savedUser = await user.save();

      // Step 6: Generate JWT token for immediate authentication
      const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "5m",
      });

      // Step 7: Send success response
      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: savedUser._id,
          email: savedUser.email,
          fullName: `${savedUser.firstName} ${savedUser.lastName}`,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating user", error });
    }
  }

  // User Login Handler
  public async login(req: Request, res: Response): Promise<any> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "5m",
      });

      const refreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({
        message: "Login successful",
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          fullName: `${user.firstName} ${user.lastName}`,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Error logging in", error });
    }
  }

  public async refreshToken(req: Request, res: Response): Promise<any> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required" });
      }

      const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
        userId: string;
      };

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newAccessToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "5m",
      });

      const newRefreshToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: "Refresh token has expired" });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      res.status(500).json({ message: "Error refreshing token", error });
    }
  }
}

export default AuthController;
