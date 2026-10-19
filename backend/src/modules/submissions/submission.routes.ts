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
submissionRoutes.patch(
  "/:id/resubmit",
  submissionLimiter,
  validate(idParamSchema, "params"),
  validate(updateSubmissionSchema),
  controller.resubmit,
);
