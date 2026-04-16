export type ApiResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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

