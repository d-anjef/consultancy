/**
 * Safely extract a MongoDB ObjectId as string from either:
 * - A populated Mongoose document (has `_id`)
 * - A raw ObjectId reference
 * - A string
 * - null/undefined
 */
export function extractId(ref: unknown): string | null {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  const r = ref as { _id?: unknown };
  if (r._id !== undefined && r._id !== null) return String(r._id);
  return String(ref);
}