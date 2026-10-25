import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { submissionLimiter } from "../../middlewares/rate-limiters.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./submission.controller.js";
import { createSubmissionSchema, idParamSchema, updateSubmissionSchema } from "./submission.schema.js";

export const submissionRoutes = Router();

submissionRoutes.use(authenticate, authorize("STUDENT"));

submissionRoutes.post("/", submissionLimiter, validate(createSubmissionSchema), controller.create);
submissionRoutes.get("/me", controller.getMine);
// Edit (PENDING stays PENDING, REJECTED goes back to PENDING). Counts toward the submission limit.
submissionRoutes.patch(
  "/:id",
  submissionLimiter,
  validate(idParamSchema, "params"),
  validate(updateSubmissionSchema),
  controller.update,
);
submissionRoutes.delete("/:id", validate(idParamSchema, "params"), controller.remove);
