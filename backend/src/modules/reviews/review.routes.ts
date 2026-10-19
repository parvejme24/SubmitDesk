import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { idParamSchema } from "../submissions/submission.schema.js";
import * as controller from "./review.controller.js";
import { listQuerySchema, reviewSchema } from "./review.schema.js";

export const reviewRoutes = Router();

reviewRoutes.use(authenticate, authorize("MENTOR"));

reviewRoutes.get("/stats", controller.stats);
reviewRoutes.get("/submissions", validate(listQuerySchema, "query"), controller.list);
reviewRoutes.get("/submissions/:id", validate(idParamSchema, "params"), controller.detail);
reviewRoutes.patch(
  "/submissions/:id/review",
  validate(idParamSchema, "params"),
  validate(reviewSchema),
  controller.review,
);
