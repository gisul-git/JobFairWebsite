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
  address: string;
  collegeOrCompany: string;
  registeredAt: Date;

  referralCode?: string;
  referredBy?: string | null;
  referralCount: number;

  role: "BDE" | "Fullstack" | null;
  points: number;

  funnel: {
    currentStep: number;
    completedSteps: number[];
    completedAt?: Date;
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

  resume: {
    uploaded: boolean;
    uploadedAt?: Date;
    blobUrl?: string;
    filename?: string;
  };

  assessment: {
    role?: string;
    answers: number[];
    answersInProgress: Map<string, number>;
    lastQuestionIndex: number;
    score?: number;
    correctCount?: number;
    totalQuestions?: number;
    timeTaken?: number;
    startedAt?: Date;
    submittedAt?: Date;
    completed: boolean;
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
    address: { type: String, required: true },
    collegeOrCompany: { type: String, required: true },
    registeredAt: { type: Date, default: () => new Date() },
    role: { type: String, enum: ["BDE", "Fullstack", null], default: null },
    points: { type: Number, default: 0 },

    referralCode: { type: String, unique: true },
    referredBy: { type: String, default: null },
    referralCount: { type: Number, default: 0 },

    funnel: {
      currentStep: { type: Number, default: 1 },
      completedSteps: { type: [Number], default: [] },
      completedAt: { type: Date },
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

    resume: {
      uploaded: { type: Boolean, default: false },
      uploadedAt: { type: Date },
      blobUrl: { type: String },
      filename: { type: String },
    },

    assessment: {
      role: { type: String },
      answers: { type: [Number], default: [] },
      answersInProgress: { type: Map, of: Number, default: {} },
      lastQuestionIndex: { type: Number, default: 0 },
      score: { type: Number },
      correctCount: { type: Number },
      totalQuestions: { type: Number },
      timeTaken: { type: Number },
      startedAt: { type: Date },
      submittedAt: { type: Date },
      completed: { type: Boolean, default: false },
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

