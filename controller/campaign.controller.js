import mongoose from "mongoose";
import Campaign from "../model/campaign.model.js";
import { Product } from "../model/index.model.js";

// Keep the same visibility rules used by product.controller.js.
const PUBLIC_PRODUCT_FILTER = {
  approvalStatus: "approved",
  isPublished: true,
};

const safeResponse = (message, errors) => ({ message, ...(errors ? { errors } : {}) });
const isValidSlug = (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
const visibleNow = (date = new Date()) => ({
  status: "active",
  $and: [
    { $or: [{ startDate: null }, { startDate: { $lte: date } }] },
    { $or: [{ endDate: null }, { endDate: { $gte: date } }] },
  ],
});

const formatCampaign = (doc) => ({
  _id: doc._id,
  title: doc.title,
  slug: doc.slug,
  bannerImage: doc.bannerImage,
  description: doc.description,
  sortOrder: doc.sortOrder,
});

const getDate = (value) => {
  if (value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

async function prepareCampaignPayload(body, { creating = false, existing = null } = {}) {
  const errors = {};
  const changes = {};
  const fields = ["title", "slug", "bannerImage", "description", "status", "showOnHome", "sortOrder", "startDate", "endDate", "productIds"];

  for (const field of fields) {
    if (!(field in body)) continue;
    if (["title", "slug", "bannerImage", "description", "status"].includes(field)) {
      changes[field] = String(body[field] ?? "").trim();
    } else if (field === "startDate" || field === "endDate") {
      changes[field] = getDate(body[field]);
      if (changes[field] === undefined) errors[field] = "Invalid date";
    } else if (field === "showOnHome") {
      if (typeof body[field] !== "boolean") errors[field] = "Must be true or false";
      else changes[field] = body[field];
    } else if (field === "sortOrder") {
      const value = Number(body[field]);
      if (!Number.isSafeInteger(value) || value < -100000 || value > 100000) errors[field] = "Must be a valid integer";
      else changes[field] = value;
    } else if (field === "productIds") {
      if (!Array.isArray(body.productIds) || body.productIds.length > 100) {
        errors.productIds = "Choose at most 100 products";
      } else {
        const ids = [...new Set(body.productIds.map(String))];
        if (!ids.every((id) => mongoose.isValidObjectId(id))) {
          errors.productIds = "Invalid product ID";
        } else {
          changes.productIds = ids;
          if (ids.length) {
            const count = await Product.countDocuments({ _id: { $in: ids }, ...PUBLIC_PRODUCT_FILTER });
            if (count !== ids.length) errors.productIds = "Some products are not approved, published, or do not exist";
          }
        }
      }
    }
  }

  const merged = { ...(existing || {}), ...changes };
  if (creating || "title" in changes) {
    if (!merged.title || merged.title.length > 120) errors.title = "Title is required (max 120 characters)";
  }
  if (creating || "slug" in changes) {
    if (!merged.slug || !isValidSlug(merged.slug)) errors.slug = "Use lowercase letters, numbers and hyphens";
  }
  if (creating || "bannerImage" in changes) {
    if (!merged.bannerImage || merged.bannerImage.length > 1500 || /^(?:javascript:|data:)/i.test(merged.bannerImage)) {
      errors.bannerImage = "A valid uploaded image path or URL is required";
    }
  }
  if (merged.description?.length > 300) errors.description = "Maximum 300 characters";
  if (!['draft', 'active', 'paused'].includes(merged.status || 'draft')) errors.status = "Invalid status";
  if (merged.startDate && merged.endDate && new Date(merged.endDate) < new Date(merged.startDate)) {
    errors.endDate = "End date must be later than start date";
  }
  if (merged.status === 'active' && !(merged.productIds?.length)) {
    errors.productIds = "At least one product is required before activation";
  }
  return { changes, errors };
}

// GET /api/campaigns : public home banners
export const listPublicCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ ...visibleNow(), showOnHome: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(30)
      .lean();
    res.json(campaigns.map(formatCampaign));
  } catch (error) {
    console.error('listPublicCampaigns:', error);
    res.status(500).json(safeResponse('Failed to load campaigns'));
  }
};

// GET /api/campaigns/:slug : selected products only
export const getPublicCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ slug: req.params.slug, ...visibleNow() }).lean();
    if (!campaign) return res.status(404).json(safeResponse('Campaign not found'));
    const products = await Product.find({ _id: { $in: campaign.productIds }, ...PUBLIC_PRODUCT_FILTER })
      .select('productName productImage price regularPrice brand stock status flashSale preBook')
      .lean();
    const byId = new Map(products.map((product) => [String(product._id), product]));
    const ordered = campaign.productIds.map((id) => byId.get(String(id))).filter(Boolean);
    res.json({ ...formatCampaign(campaign), products: ordered });
  } catch (error) {
    console.error('getPublicCampaign:', error);
    res.status(500).json(safeResponse('Failed to load campaign'));
  }
};

// GET /api/campaigns/admin : protected
export const listAdminCampaigns = async (_req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
    res.json(campaigns);
  } catch (error) {
    console.error('listAdminCampaigns:', error);
    res.status(500).json(safeResponse('Failed to load campaigns'));
  }
};

export const getAdminCampaign = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json(safeResponse('Invalid campaign ID'));
    const campaign = await Campaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json(safeResponse('Campaign not found'));
    res.json(campaign);
  } catch (error) {
    console.error('getAdminCampaign:', error);
    res.status(500).json(safeResponse('Failed to load campaign'));
  }
};

export const createCampaign = async (req, res) => {
  try {
    const { changes, errors } = await prepareCampaignPayload(req.body || {}, { creating: true });
    if (Object.keys(errors).length) return res.status(422).json(safeResponse('Validation error', errors));
    const campaign = await Campaign.create(changes);
    res.status(201).json(campaign);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json(safeResponse('Campaign slug already exists'));
    console.error('createCampaign:', error);
    res.status(500).json(safeResponse('Failed to create campaign'));
  }
};

export const updateCampaign = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json(safeResponse('Invalid campaign ID'));
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json(safeResponse('Campaign not found'));
    const existing = campaign.toObject();
    const { changes, errors } = await prepareCampaignPayload(req.body || {}, { existing });
    if (Object.keys(errors).length) return res.status(422).json(safeResponse('Validation error', errors));
    Object.assign(campaign, changes);
    await campaign.save();
    res.json(campaign);
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json(safeResponse('Campaign slug already exists'));
    console.error('updateCampaign:', error);
    res.status(500).json(safeResponse('Failed to update campaign'));
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json(safeResponse('Invalid campaign ID'));
    const deleted = await Campaign.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json(safeResponse('Campaign not found'));
    res.json({ message: 'Campaign deleted. Products were not deleted.' });
  } catch (error) {
    console.error('deleteCampaign:', error);
    res.status(500).json(safeResponse('Failed to delete campaign'));
  }
};

// GET /api/campaigns/admin/available-products - paginated admin product picker.
export const listCampaignSelectableProducts = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const q = String(req.query.q || '').trim().slice(0, 80);
    const filter = { ...PUBLIC_PRODUCT_FILTER };
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { productName: { $regex: escaped, $options: 'i' } },
        { sku: { $regex: escaped, $options: 'i' } },
      ];
    }
    const [items, total] = await Promise.all([
      Product.find(filter)
        .select('_id productName sku productImage price regularPrice stock status')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    return res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('listCampaignSelectableProducts:', error);
    return res.status(500).json({ message: 'Failed to load products' });
  }
};
