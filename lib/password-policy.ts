// Keep in sync with Clerk dashboard → Configure → Password so the server
// enforces the same rules. Clerk also rejects passwords found in data
// breaches, which can only be checked server-side.
export const PASSWORD_MIN_LENGTH = 15;

// Clerk's `allowed_special_characters` for this instance.
const SPECIAL_CHARACTERS = "!\"#$%&'()*+,-./:;<=>?@[]^_`{|}~";

export type PasswordRule = {
  id: string;
  /** Used in sentences, e.g. error messages. */
  label: string;
  /** Used in the compact requirements checklist. */
  shortLabel: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    shortLabel: `${PASSWORD_MIN_LENGTH}+ characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lowercase",
    label: "A lowercase letter",
    shortLabel: "Lowercase",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "uppercase",
    label: "An uppercase letter",
    shortLabel: "Uppercase",
    test: (password) => /[A-Z]/.test(password),
  },
  { id: "number", label: "A number", shortLabel: "Number", test: (password) => /[0-9]/.test(password) },
  {
    id: "special",
    label: "A symbol, like ! or #",
    shortLabel: "Symbol",
    test: (password) => [...password].some((char) => SPECIAL_CHARACTERS.includes(char)),
  },
];

export function passwordError(password: string): string | null {
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password));
  return failed ? `Password needs: ${failed.label.toLowerCase()}` : null;
}
