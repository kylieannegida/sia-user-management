import mongoose, { Schema } from "mongoose";
import { IUser } from "../interfaces/userInterface";

// Define the schema for the User model
// Schema specifies the structure and validation rules for User documents in MongoDB
export const userSchema = new Schema(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    // User email field - must be unique, required, and max 100 characters
    email: { type: String, length: 100, required: true, unique: true, index: true},
    // Password field - required and max 50 characters
    password: { type: String, length: 50, required: true },
    // First name field - required and max 50 characters
    firstName: { type: String, length: 50, required: true },
    // Last name field - required and max 50 characters
    lastName: { type: String, length: 50, required: true },
  },
  // Enable automatic timestamp fields (createdAt and updatedAt)
  { timestamps: true }
);

// Create and export the User model
export const User = mongoose.model<IUser>("Users", userSchema);