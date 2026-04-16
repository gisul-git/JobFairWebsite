export type SocialVerificationResult = {
  ok: boolean;
  details?: unknown;
};

export async function verifySocialPost(_input: unknown): Promise<SocialVerificationResult> {
  // TODO: implement verification against social APIs / OAuth
  throw new Error("Not implemented");
}

