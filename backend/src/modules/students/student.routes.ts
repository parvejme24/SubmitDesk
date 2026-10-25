import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { idParamSchema } from "../submissions/submission.schema.js";
import * as controller from "./student.controller.js";
import { studentListQuerySchema } from "./student.schema.js";

// Mentor-only: browse students and their results. Mounted at /mentor/students.
export const studentRoutes = Router();

studentRoutes.use(authenticate, authorize("MENTOR"));

studentRoutes.get("/", validate(studentListQuerySchema, "query"), controller.list);
studentRoutes.get("/:id", validate(idParamSchema, "params"), controller.detail);
