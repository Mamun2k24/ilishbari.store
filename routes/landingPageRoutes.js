
import express from "express";

import {
  createLandingPage,
  getAllLandingPages,
  getLandingPageById,
  getLandingPageBySlug,
  updateLandingPage,
  deleteLandingPage,
  updateLandingStatus,
  getHomepageLandingPage,
  setHomepageLandingPage,
} from "../controller/landingPageController.js";

import {
  protect,
  ensureAdmin,
} from "../middleware/protect.js";

const router = express.Router();

// Public: selected homepage
router.get("/public/homepage", getHomepageLandingPage);

// Public: individual landing page
router.get("/public/:slug", getLandingPageBySlug);

// Admin: create
router.post("/", protect, ensureAdmin, createLandingPage);

// Admin: list
router.get("/", protect, ensureAdmin, getAllLandingPages);

// Admin: choose homepage
router.patch(
  "/:id/set-homepage",
  protect,
  ensureAdmin,
  setHomepageLandingPage
);

// Admin: edit data
router.get("/:id", protect, ensureAdmin, getLandingPageById);
router.put("/:id", protect, ensureAdmin, updateLandingPage);

// Admin: delete
router.delete("/:id", protect, ensureAdmin, deleteLandingPage);

// Admin: publish, draft, inactive
router.patch(
  "/:id/status",
  protect,
  ensureAdmin,
  updateLandingStatus
);

export default router;
