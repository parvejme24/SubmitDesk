import type { Response } from "express";

type Payload<T> = {
  statusCode?: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
};

export function sendResponse<T>(res: Response, { statusCode = 200, message, data, meta }: Payload<T>) {
  return res.status(statusCode).json({ success: true, message, data, meta });
}
