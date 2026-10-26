import express from 'express';
import uploadMemory from '../middleware/uploadMemory.js';
import { protect, ensureAdmin } from '../middleware/protect.js';
import { uploadCampaignPoster } from '../controller/campaignUpload.controller.js';
import {
  listPublicCampaigns,
  getPublicCampaign,
  listAdminCampaigns,
  getAdminCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  listCampaignSelectableProducts,
} from '../controller/campaign.controller.js';

const router = express.Router();

// Public campaigns, consumed by homepage and ad landing pages.
router.get('/', listPublicCampaigns);

// All write/upload endpoints require the project's existing JWT auth and admin role.
router.get('/admin', protect, ensureAdmin, listAdminCampaigns);
router.post(
  '/admin/upload-poster',
  protect,
  ensureAdmin,
  uploadMemory.single('image'),
  uploadCampaignPoster,
);
router.get('/admin/available-products', protect, ensureAdmin, listCampaignSelectableProducts);
router.get('/admin/:id', protect, ensureAdmin, getAdminCampaign);
router.post('/admin', protect, ensureAdmin, createCampaign);
router.put('/admin/:id', protect, ensureAdmin, updateCampaign);
router.delete('/admin/:id', protect, ensureAdmin, deleteCampaign);

// Must remain AFTER /admin routes.
router.get('/:slug', getPublicCampaign);

export default router;
