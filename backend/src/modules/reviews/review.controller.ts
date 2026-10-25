import type { RequestHandler } from "express";
import { sendResponse } from "../../utils/send-response.js";
import * as reviewService from "./review.service.js";

export const stats: RequestHandler = async (_req, res) => {
  const data = await reviewService.getStats();
  sendResponse(res, { message: "Submission stats", data });
};

export const list: RequestHandler = async (_req, res) => {
  const { items, meta } = await reviewService.listSubmissions(res.locals.query);
  sendResponse(res, { message: "Submissions", data: items, meta });
};

export const detail: RequestHandler = async (_req, res) => {
  const data = await reviewService.getSubmission(res.locals.params.id);
  sendResponse(res, { message: "Submission", data });
};

export const review: RequestHandler = async (req, res) => {
  const data = await reviewService.reviewSubmission(req.user!.id, res.locals.params.id, res.locals.body);
  sendResponse(res, { message: "Review saved", data });
};

export const grade: RequestHandler = async (_req, res) => {
  const data = await reviewService.gradeSubmission(res.locals.params.id, res.locals.body);
  sendResponse(res, { message: "Mark and feedback saved", data });
};
