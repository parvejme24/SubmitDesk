import type { CookieOptions, RequestHandler } from "express";
import { env } from "../../config/env.js";
import { sendResponse } from "../../utils/send-response.js";
import * as authService from "./auth.service.js";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};

export const signup: RequestHandler = async (_req, res) => {
  const { user, token } = await authService.signup(res.locals.body);
  res.cookie("token", token, cookieOptions);
  sendResponse(res, { statusCode: 201, message: "Account created", data: { user, token } });
};

export const login: RequestHandler = async (_req, res) => {
  const { user, token } = await authService.login(res.locals.body);
  res.cookie("token", token, cookieOptions);
  sendResponse(res, { message: "Logged in", data: { user, token } });
};

export const logout: RequestHandler = (_req, res) => {
  const { maxAge: _m, ...clearOptions } = cookieOptions;
  res.clearCookie("token", clearOptions);
  sendResponse(res, { message: "Logged out" });
};

export const me: RequestHandler = async (req, res) => {
  const user = await authService.me(req.user!.id);
  sendResponse(res, { message: "Current user", data: user });
};
