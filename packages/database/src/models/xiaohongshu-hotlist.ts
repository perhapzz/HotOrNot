import mongoose, { Schema, Document } from "mongoose";

export interface IXiaohongshuHotItem extends Document {
  id: string;
  title: string;
  icon?: string;
  title_img?: string;
  rank_change: number;
  score: string;
  type: string;
  word_type: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IXiaohongshuHotList extends Document {
  hot_list_id: string;
  title: string;
  background_color: any;
  host: string;
  is_new_hot_list_exp: boolean;
  items: IXiaohongshuHotItem[];
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const XiaohongshuHotItemSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    icon: { type: String },
    title_img: { type: String },
    rank_change: { type: Number, default: 0 },
    score: { type: String, required: true },
    type: { type: String, default: "normal" },
    word_type: { type: String, default: "无" },
  },
  {
    timestamps: true,
    _id: false,
  },
);

const XiaohongshuHotListSchema = new Schema(
  {
    hot_list_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    background_color: { type: Schema.Types.Mixed },
    host: { type: String, default: "" },
    is_new_hot_list_exp: { type: Boolean, default: false },
    items: [XiaohongshuHotItemSchema],
    fetchedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  },
);

// 创建索引以优化查询性能
XiaohongshuHotListSchema.index({ fetchedAt: -1 });
XiaohongshuHotListSchema.index({ hot_list_id: 1, fetchedAt: -1 });

export const XiaohongshuHotList =
  mongoose.models.XiaohongshuHotList ||
  mongoose.model<IXiaohongshuHotList>(
    "XiaohongshuHotList",
    XiaohongshuHotListSchema,
  );
