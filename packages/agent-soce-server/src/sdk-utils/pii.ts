const PII_PATTERNS = [
  /\b\d{10,13}\b/g,
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
];

export function sanitizePII(text: string): string {
  let sanitized = text;
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, '***');
  }
  return sanitized;
}
