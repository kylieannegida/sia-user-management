import { Request, Response } from "express";
import { User } from "../models/user";
import { IUser } from "../interfaces/userInterface";
import mongoose from "mongoose";
import { validateUser } from "../validations/userValidation";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export class UserController {
  // Register a new user
  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { error, value: payload } = validateUser(req.body);
      if (error) {
        res.status(400).json({ message: error.details.map((err) => err.message) });
        return;
      }
  
      const existingUser = await User.findOne({ email: payload.email });
      if (existingUser) {
        res.status(409).json({ message: "Email already exists" });
        return;
      }
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(payload.password, salt);
  
      const userData: IUser = {
        _id: uuidv4(), // Use UUID to generate string _id
        ...payload,
        password: hashedPassword,
      };
  
      const user = new User(userData);
      const savedUser = await user.save();
  
      const withoutPassword = { ...savedUser.toJSON() } as Partial<IUser>;
      delete withoutPassword.password;
  
      res.status(201).json({
        message: "User registered successfully",
        user: withoutPassword,
      });
    } catch (error: any) {
      res.status(500).json({ message: "An error occurred", error: error.message });
    }
  }
  

   // Get all users
  // Handles GET requests to retrieve all users from the database
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // Fetch all users from database, excluding sensitive password field
      const users: IUser[] = await User.find().select("-password");
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get user by ID
  // Handles GET requests to retrieve a specific user by their ID
  public async getUserById(req: Request, res: Response): Promise<void> {
    try {
      // Attempt to find user by ID, excluding password field
      const user: IUser | null = await User.findById(req.params.id).select(
        "-password"
      );

      // Return 404 if user doesn't exist
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Return the found user
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update user
  // Handles PUT/PATCH requests to update an existing user
  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      // Validate the updated user data
      const { error, value: payload } = validateUser(req.body);
      if (error) {
        res
          .status(400)
          .json({ message: error.details.map((err) => err.message) });
        return;
      }

      // Hash the new password if it's being updated
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(payload.password, salt);

      // Prepare update data with hashed password
      const userData: Partial<IUser> = { ...payload, password: hashedPassword };

      // Update the user and get the updated document
      const user: IUser | null = await User.findByIdAndUpdate(
        req.params.id,
        userData,
        { new: true } // This option returns the modified document rather than the original
      );

      // Return 404 if user doesn't exist
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Remove password from response data for security
      let withoutPassword = user.toJSON();
      delete withoutPassword.password;

      // Return the updated user without password
      res.json(withoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Delete user
  // Handles DELETE requests to remove a user from the database
  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      // Attempt to find and delete the user in one operation
      const user: IUser | null = await User.findByIdAndDelete(req.params.id);

      // Return 404 if user doesn't exist
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Confirm successful deletion
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
