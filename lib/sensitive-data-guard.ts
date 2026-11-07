/**
 * Sensitive Data Guard (OWASP Top 10 for LLM Applications LLM06 / LLM02)
 *
 * Scans input text before saving to Firestore or submitting to Gemini.
 * - Secrets (API keys, passwords, bearer tokens, private keys) -> STRICT BLOCK
 * - Personal Data (SSNs, credit card numbers, debtor identifying PII) -> WARNING
 */

export interface InspectionResult {
  hasSecret: boolean;
  hasPersonalData: boolean;
  secretReason?: string;
  personalDataReason?: string;
  redactedText?: string;
}

// Regex patterns for secrets
const SECRET_PATTERNS = [
  { name: 'Google / Gemini API Key', regex: /AIzaSy[A-Za-z0-9_-]{33}/i },
  { name: 'Generic API Key / Token', regex: /(?:api[_-]?key|access[_-]?token|secret[_-]?key|client[_-]?secret)\s*[:=]\s*['"]?[a-zA-Z0-9_\-\.]{16,}['"]?/i },
  { name: 'Bearer Token', regex: /Bearer\s+[a-zA-Z0-9_\-\.]{24,}/i },
  { name: 'Private Key Block', regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i },
  { name: 'NYSCEF / Password Assignment', regex: /(?:password|passwd|nyscef[_-]?pass)\s*[:=]\s*['"]?[^\s]{6,}['"]?/i },
  { name: 'AWS / Cloud Secret', regex: /(?:AKIA[0-9A-Z]{16})|(?:aws_secret_access_key\s*=\s*[a-zA-Z0-9/+=]{40})/i }
];

// Regex patterns for personal data (PII)
const PII_PATTERNS = [
  { name: 'Social Security Number (SSN)', regex: /\b\d{3}[-\s]\d{2}[-\s]\d{4}\b/ },
  { name: 'Credit / Debit Card Number', regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/ },
  { name: 'Monetaria Debtor SSN Combination', regex: /(?:debtor|guarantor|ssn|social security)\s*(?:is|:|\-)?\s*\d{3}[-\s]?\d{2}[-\s]?\d{4}/i }
];

export function inspectSensitiveData(text: string): InspectionResult {
  if (!text) {
    return { hasSecret: false, hasPersonalData: false };
  }

  // 1. Secrets check (Blocking)
  for (const pat of SECRET_PATTERNS) {
    if (pat.regex.test(text)) {
      return {
        hasSecret: true,
        hasPersonalData: false,
        secretReason: `Security Block: Input contains a detected secret or credential (${pat.name}). Please remove all live API keys, credentials, or tokens before submitting.`
      };
    }
  }

  // 2. Personal Data check (Warning)
  for (const pat of PII_PATTERNS) {
    if (pat.regex.test(text)) {
      return {
        hasSecret: false,
        hasPersonalData: true,
        personalDataReason: `Privacy Warning: Input contains likely personal identifying information (${pat.name}). Please describe the case or scraping issue generically without specific debtor SSNs or card numbers.`
      };
    }
  }

  return { hasSecret: false, hasPersonalData: false };
}
