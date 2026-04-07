const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const BIDI_CONTROL_REGEX = /[\u202A-\u202E\u2066-\u2069]/g;

type SanitizeTextOptions = {
  trim?: boolean;
  preserveNewlines?: boolean;
  maxLength?: number;
};

export function sanitizeTextInput(input: string, options: SanitizeTextOptions = {}) {
  const { trim = true, preserveNewlines = false, maxLength } = options;
  const controlCharsPattern = preserveNewlines ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : CONTROL_CHARS_REGEX;

  let sanitized = input.normalize("NFKC").replace(controlCharsPattern, "").replace(BIDI_CONTROL_REGEX, "");

  if (trim) {
    sanitized = sanitized.trim();
  }

  if (typeof maxLength === "number" && maxLength >= 0) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

export function sanitizeJsonValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeTextInput(value, { preserveNewlines: true });
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeJsonValue(entry));
  }

  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeJsonValue(entry)])
    );
  }

  return value;
}

export function sanitizeFileName(input: string) {
  return sanitizeTextInput(input, { maxLength: 255 });
}

export function sanitizeStoragePath(input: string) {
  const sanitized = sanitizeTextInput(input, { trim: true, maxLength: 2048 });

  if (!sanitized || sanitized.includes("\\") || sanitized.split("/").some((segment) => segment === ".." || segment === "." || !segment)) {
    throw new Error("La ruta del archivo no es valida.");
  }

  return sanitized;
}
