import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFound } from "./middlewares/not-found.js";
import { globalLimiter } from "./middlewares/rate-limiters.js";
import { router } from "./routes.js";

export const app = express();

app.set("trust proxy", 1); // correct client IP behind Render/Railway/Next proxy
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL ?? false, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(globalLimiter);
app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

// Vercel runs the app as a function and looks for a default export.
export default app;
