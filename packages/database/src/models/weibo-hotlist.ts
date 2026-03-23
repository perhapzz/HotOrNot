import mongoose, { Schema, Document } from "mongoose";

export interface IWeiboHotItem {
  title: string;
  url: string;
  hotValue: number;
  category?: string;
  icon?: string;
  rank: number;
}

export interface IWeiboHotList extends Document {
  hot_list_id: string;
  title: string;
  items: IWeiboHotItem[];
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WeiboHotItemSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String },
    hotValue: { type: Number, default: 0 },
    category: { type: String },
    icon: { type: String },
    rank: { type: Number, required: true },
  },
  { _id: false }
);

const WeiboHotListSchema = new Schema(
  {
    hot_list_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    items: [WeiboHotItemSchema],
    fetchedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

WeiboHotListSchema.index({ fetchedAt: -1 });
WeiboHotListSchema.index({ hot_list_id: 1, fetchedAt: -1 });

export const WeiboHotList =
  mongoose.models.WeiboHotList ||
  mongoose.model<IWeiboHotList>("WeiboHotList", WeiboHotListSchema);
