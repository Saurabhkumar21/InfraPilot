import { Router } from "express";
import {
  listAssets,
  addAsset,
  getAsset,
  removeAsset,
  editAsset
} from "../controllers/asset.controller.js";
import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, listAssets);
router.get("/:id", authenticate, getAsset);

router.post("/", authenticate, requireRole("ADMIN"), addAsset);
router.patch("/:id", authenticate, requireRole("ADMIN"), editAsset);
router.delete("/:id", authenticate, requireRole("ADMIN"), removeAsset);

export default router;










