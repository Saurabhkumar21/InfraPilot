import { Router } from "express";
import { listAuditLogs } from "../controllers/audit.controller.js";
import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, requireRole("ADMIN"), listAuditLogs);

export default router;