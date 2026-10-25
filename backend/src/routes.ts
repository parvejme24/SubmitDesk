import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { reviewRoutes } from "./modules/reviews/review.routes.js";
import { studentRoutes } from "./modules/students/student.routes.js";
import { submissionRoutes } from "./modules/submissions/submission.routes.js";

export const router = Router();

router.use("/auth", authRoutes);
router.use("/submissions", submissionRoutes);
router.use("/mentor/students", studentRoutes);
router.use("/mentor", reviewRoutes);
