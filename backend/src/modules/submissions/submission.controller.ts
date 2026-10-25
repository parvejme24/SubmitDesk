import type { RequestHandler } from "express";
import { sendResponse } from "../../utils/send-response.js";
import * as submissionService from "./submission.service.js";

export const create: RequestHandler = async (req, res) => {
  const submission = await submissionService.createSubmission(req.user!.id, res.locals.body);
  sendResponse(res, { statusCode: 201, message: "Project submitted", data: submission });
};

export const getMine: RequestHandler = async (req, res) => {
  const submissions = await submissionService.getMySubmissions(req.user!.id);
  sendResponse(res, { message: "Your submissions", data: submissions });
};

export const update: RequestHandler = async (req, res) => {
  const submission = await submissionService.updateSubmission(req.user!.id, res.locals.params.id, res.locals.body);
  sendResponse(res, { message: "Submission updated", data: submission });
};

export const remove: RequestHandler = async (req, res) => {
  await submissionService.deleteSubmission(req.user!.id, res.locals.params.id);
  sendResponse(res, { message: "Submission deleted" });
};
