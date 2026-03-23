import mongoose, { Schema, Document } from "mongoose";

export interface ITeamMember {
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date;
}

export interface ITeam extends Document {
  name: string;
  description?: string;
  ownerId: string;
  members: ITeamMember[];
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    description: { type: String, maxlength: 200 },
    ownerId: { type: String, required: true, index: true },
    members: [
      {
        userId: { type: String, required: true },
        role: {
          type: String,
          enum: ["owner", "admin", "member"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
);

TeamSchema.index({ "members.userId": 1 });

export const Team =
  mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);
