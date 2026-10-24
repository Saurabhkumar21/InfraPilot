import express from "express";
import cors from "cors";
import "dotenv/config";
import assetRoutes from "./routes/asset.routes.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/assets", assetRoutes);
app.use("/api/auth", authRoutes);
app.use(notFoundHandler); // Handle requests to unknown routes
app.use(errorHandler); // Handle errors passed through next(error)

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "InfraPilot API"
  });
});

export default app;

