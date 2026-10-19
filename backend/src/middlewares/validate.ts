import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type Source = "body" | "query" | "params";

/**
 * Parses req[source] with a zod schema. A ZodError is forwarded to the error handler (→ 400).
 * Cleaned/coerced data is stored on res.locals[source] (req.query is read-only in Express 5).
 */
export const validate =
  (schema: ZodType, source: Source = "body"): RequestHandler =>
  (req, res, next) => {
    res.locals[source] = schema.parse(req[source] ?? {});
    next();
  };
