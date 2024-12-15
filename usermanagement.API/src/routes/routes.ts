import { Router } from "express";
import userRoutes from "./userRoutes";
import authRoutes from "./authRoutes";
// Import other route files here (e.g., productRoutes)
// import productRoutes from './productRoutes';

// Create main router instance
const router = Router();

/**
 * Health Check
 * Endpoint to verify API is running.
 * Accessible at /main/healthcheck.
 */
router.get("/main/healthcheck", (req, res) => {
  res.status(200).json({
    message: "API is healthy",
  });
});

// Mount user routes under /api prefix
// Example: POST /api/register, GET /api/users
router.use("/api", userRoutes);

// Mount authentication routes
// Example: POST /api/auth/login
router.use("/api/auth", authRoutes);

export default router;
