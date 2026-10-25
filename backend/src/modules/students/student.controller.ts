import type { RequestHandler } from "express";
import { sendResponse } from "../../utils/send-response.js";
import * as studentService from "./student.service.js";

export const list: RequestHandler = async (_req, res) => {
  const { items, meta } = await studentService.listStudents(res.locals.query);
  sendResponse(res, { message: "Students", data: items, meta });
};

export const detail: RequestHandler = async (_req, res) => {
  const data = await studentService.getStudent(res.locals.params.id);
  sendResponse(res, { message: "Student", data });
};
