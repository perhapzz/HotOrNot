import mongoose, { Schema, Document } from "mongoose";

export interface IBilibiliHotItem {
  title: string;
  url: string;
  pic?: string;
  desc?: string;
  stat?: {
    view: number;
    like: number;
    danmaku: number;
  };
  score?: number;
  rank: number;
}

export interface IBilibiliHotList extends Document {
  hot_list_id: string;
  title: string;
  items: IBilibiliHotItem[];
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BilibiliHotItemSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String },
    pic: { type: String },
    desc: { type: String },
    stat: {
      view: { type: Number, default: 0 },
      like: { type: Number, default: 0 },
      danmaku: { type: Number, default: 0 },
    },
    score: { type: Number },
    rank: { type: Number, required: true },
  },
  { _id: false }
);

const BilibiliHotListSchema = new Schema(
  {
    hot_list_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    items: [BilibiliHotItemSchema],
    fetchedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

BilibiliHotListSchema.index({ fetchedAt: -1 });
BilibiliHotListSchema.index({ hot_list_id: 1, fetchedAt: -1 });

export const BilibiliHotList =
  mongoose.models.BilibiliHotList ||
  mongoose.model<IBilibiliHotList>("BilibiliHotList", BilibiliHotListSchema);
