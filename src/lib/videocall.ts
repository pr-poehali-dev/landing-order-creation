export const CALL_PREFIX = '[call:';

export function createCallUrl(projectId: number) {
  const rand = Math.random().toString(36).slice(2, 8);
  const room = `LandingGuru-Project${projectId}-${rand}`;
  return `https://meet.jit.si/${room}`;
}

export function parseCallUrl(text: string): string | null {
  if (!text.startsWith(CALL_PREFIX) || !text.endsWith(']')) return null;
  return text.slice(CALL_PREFIX.length, -1);
}
