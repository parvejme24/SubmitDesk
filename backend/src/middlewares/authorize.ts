import type { RequestHandler } from "express";
import type { Role } from "../lib/jwt.js";
import { AppError } from "../utils/app-error.js";

// AuthZ: are you allowed? (401 = not logged in, 403 = logged in but wrong role)
export const authorize =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) throw new AppError(401, "Please log in");
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "You do not have permission to do this");
    }
    next();
  };
