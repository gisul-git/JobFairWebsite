export type ApiResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface IUser {
  name: string;
  email: string;
  phone: string;
  address: string;
  collegeOrCompany: string;
  registeredAt: Date;

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
    certificateId?: string;
    downloadCount: number;
  };

  social: {
    google: { verified: boolean; verifiedAt?: Date };
    linkedin: { verified: boolean; accessToken?: string; verifiedAt?: Date };
    instagram: { verified: boolean; accessToken?: string; verifiedAt?: Date };
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
    answersInProgress?: Record<string, number>;
    lastQuestionIndex?: number;
    score?: number;
    correctCount?: number;
    totalQuestions?: number;
    timeTaken?: number;
    githubUrl?: string | null;
    deployedUrl?: string | null;
    notes?: string | null;
    startedAt?: Date;
    submittedAt?: Date;
    completed: boolean;
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

