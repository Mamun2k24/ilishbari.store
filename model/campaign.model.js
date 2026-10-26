import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    bannerImage: { type: String, required: true, trim: true, maxlength: 1500 },
    description: { type: String, trim: true, default: "", maxlength: 300 },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    status: {
      type: String,
      enum: ["draft", "active", "paused"],
      default: "draft",
    },
    showOnHome: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true },
);

campaignSchema.index({ status: 1, showOnHome: 1, sortOrder: 1 });

const Campaign = mongoose.model("Campaign", campaignSchema);
export default Campaign;
