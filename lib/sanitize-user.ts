type AnyRecord = Record<string, any>;

export function sanitizeUser<T extends AnyRecord>(user: T | null | undefined) {
  if (!user) return user;

  const cloned: AnyRecord = JSON.parse(JSON.stringify(user));

  if (cloned.social?.linkedin) delete cloned.social.linkedin.accessToken;
  if (cloned.social?.instagram) delete cloned.social.instagram.accessToken;

  return cloned as T;
}

