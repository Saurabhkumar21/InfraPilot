import { Router } from "express";
import {
  createProvisioning,
  getProvisioningStatus,
} from "../controllers/provisioning.controller.js";
import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  createProvisioning
);

router.get(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  getProvisioningStatus
);

export default router;