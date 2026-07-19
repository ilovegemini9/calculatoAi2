export function validateGeneratedCode(payload: { formulaCode?: string; validationCode?: string; testsCode?: string; meta?: { calculateBody?: string } }) {
  const forbiddenPatterns = [
    { pattern: /\bfetch\s*\(/, label: 'fetch' },
    { pattern: /\bXMLHttpRequest\b/, label: 'XMLHttpRequest' },
    { pattern: /\bdocument\./, label: 'document.' },
    { pattern: /\bwindow\./, label: 'window.' },
    { pattern: /\beval\s*\(/, label: 'eval' },
    { pattern: /\bimport\b/, label: 'import' },
    { pattern: /\brequire\s*\(/, label: 'require' },
    { pattern: /\blocalStorage\b/, label: 'localStorage' },
    { pattern: /\bsessionStorage\b/, label: 'sessionStorage' },
    { pattern: /\bcookies?\b/, label: 'cookie' }
  ];

  const snippets = [payload.formulaCode, payload.validationCode, payload.testsCode, payload.meta?.calculateBody]
    .filter((value): value is string => Boolean(value))
    .join('\n');

  return forbiddenPatterns.filter(({ pattern }) => pattern.test(snippets)).map(({ label }) => label);
}
