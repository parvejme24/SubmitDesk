import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { loginLimiter, signupLimiter } from "../../middlewares/rate-limiters.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./auth.controller.js";
import { loginSchema, signupSchema } from "./auth.schema.js";

export const authRoutes = Router();

authRoutes.post("/signup", signupLimiter, validate(signupSchema), controller.signup);
authRoutes.post("/login", loginLimiter, validate(loginSchema), controller.login);
authRoutes.post("/logout", controller.logout);
authRoutes.get("/me", authenticate, controller.me);
