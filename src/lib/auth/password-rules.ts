export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { label: "One symbol", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function passwordScore(password: string): number {
  return PASSWORD_RULES.filter((rule) => rule.test(password)).length;
}

/** Shared by the form (live hints) and the API routes (the real check). */
export function isPasswordValid(password: string): boolean {
  return password.length <= PASSWORD_MAX_LENGTH && passwordScore(password) === PASSWORD_RULES.length;
}
