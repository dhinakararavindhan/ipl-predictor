/**
 * Deep clone for engine state. GameState/AiRuntime are plain JSON data, so a
 * JSON round-trip is a correct fallback on runtimes without structuredClone
 * (older Hermes on React Native).
 */
export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}
