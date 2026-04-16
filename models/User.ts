import { nanoid } from "nanoid";
import {
  model,
  models,
  Schema,
  type HydratedDocument,
  type Model,
} from "mongoose";

export interface IUser {
  name: string;
  email: string;
  phone: string;
  collegeOrCompany: string;
  registeredAt: Date;

  referralCode?: string;
  referredBy?: string | null;
  referralCount: number;

  funnel: {
    currentStep: number;
    completedSteps: number[];
  };

  courses: {
    aiFundamentals: {
      started?: Date;
      completed?: Date;
      progressPercent: number;
      watchedSeconds: number;
    };
    softSkills: {
      started?: Date;
      completed?: Date;
      progressPercent: number;
      watchedSeconds: number;
    };
  };

  certificate: {
    issued: boolean;
    issuedAt?: Date;
    blobUrl?: string;
    downloadCount: number;
  };

  social: {
    google: { verified: boolean; verifiedAt?: Date };
    linkedin: { verified: boolean; accessToken?: string; verifiedAt?: Date };
    instagram: { verified: boolean; accessToken?: string; verifiedAt?: Date };
  };

  luckyDraw: {
    eligible: boolean;
    entries: number;
    isWinner: boolean;
    prize?: string;
  };

  opportunity: {
    interestedInRole?: boolean;
    respondedAt?: Date;
  };

  isAdmin: boolean;
}

export type UserDocument = HydratedDocument<IUser>;

const CourseProgressSchema = new Schema(
  {
    started: { type: Date },
    completed: { type: Date },
    progressPercent: { type: Number, default: 0 },
    watchedSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    collegeOrCompany: { type: String, required: true },
    registeredAt: { type: Date, default: () => new Date() },

    referralCode: { type: String, unique: true },
    referredBy: { type: String, default: null },
    referralCount: { type: Number, default: 0 },

    funnel: {
      currentStep: { type: Number, default: 1 },
      completedSteps: { type: [Number], default: [] },
    },

    courses: {
      aiFundamentals: { type: CourseProgressSchema, default: () => ({}) },
      softSkills: { type: CourseProgressSchema, default: () => ({}) },
    },

    certificate: {
      issued: { type: Boolean, default: false },
      issuedAt: { type: Date },
      blobUrl: { type: String },
      downloadCount: { type: Number, default: 0 },
    },

    social: {
      google: {
        verified: { type: Boolean, default: false },
        verifiedAt: { type: Date },
      },
      linkedin: {
        verified: { type: Boolean, default: false },
        accessToken: { type: String },
        verifiedAt: { type: Date },
      },
      instagram: {
        verified: { type: Boolean, default: false },
        accessToken: { type: String },
        verifiedAt: { type: Date },
      },
    },

    luckyDraw: {
      eligible: { type: Boolean, default: false },
      entries: { type: Number, default: 1 },
      isWinner: { type: Boolean, default: false },
      prize: { type: String },
    },

    opportunity: {
      interestedInRole: { type: Boolean },
      respondedAt: { type: Date },
    },

    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: false }
);

UserSchema.pre("save", function () {
  if (!this.referralCode) {
    this.referralCode = nanoid(8);
  }
});

UserSchema.index({ email: 1 });
UserSchema.index({ referralCode: 1 });
UserSchema.index({ referredBy: 1 });

export const User: Model<IUser> =
  (models.User as Model<IUser> | undefined) || model<IUser>("User", UserSchema);

