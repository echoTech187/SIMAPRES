/**
 * SIMAPRES 110 - HIGH-PERFORMANCE BIGINT SERIALIZER & TYPE MAPPER
 * Lapisan: Lib / Cross-cutting
 * 
 * Replaces expensive JSON.stringify / JSON.parse double-pass serialization with
 * direct object property traversal. Ensures TypeScript accurately maps `bigint` fields to `string`.
 */

export type SerializedBigInt<T> = T extends bigint
  ? string
  : T extends Date
  ? string
  : T extends (infer U)[]
  ? SerializedBigInt<U>[]
  : T extends readonly (infer U)[]
  ? readonly SerializedBigInt<U>[]
  : T extends (...args: unknown[]) => unknown
  ? T
  : T extends object
  ? { [K in keyof T]: SerializedBigInt<T[K]> }
  : T;

/**
 * High-performance, zero-double-parse BigInt and Date serializer for React Server Actions.
 * Converts BigInts to string and Dates to ISO strings while preserving class values and avoiding memory thrashing.
 */
export function serializeBigInt<T>(value: T): SerializedBigInt<T> {
  if (value === null || value === undefined) {
    return value as SerializedBigInt<T>;
  }

  const type = typeof value;

  if (type === 'bigint') {
    return (value as bigint).toString() as SerializedBigInt<T>;
  }

  if (type === 'string' || type === 'number' || type === 'boolean' || type === 'symbol' || type === 'function') {
    return value as unknown as SerializedBigInt<T>;
  }

  if (value instanceof Date) {
    return value.toISOString() as unknown as SerializedBigInt<T>;
  }

  if (Array.isArray(value)) {
    const len = value.length;
    const result = new Array(len);
    for (let i = 0; i < len; i++) {
      result[i] = serializeBigInt(value[i]);
    }
    return result as SerializedBigInt<T>;
  }

  // Handle Plain Objects and Domain Entities with toJSON()
  if (type === 'object') {
    // If object has a custom toJSON method (e.g. Domain Entities), use its returned representation
    const record = (
      typeof (value as unknown as { toJSON?: () => unknown }).toJSON === 'function'
        ? (value as unknown as { toJSON: () => unknown }).toJSON()
        : value
    ) as Record<string, unknown>;


    if (record === null || typeof record !== 'object') {
      return record as unknown as SerializedBigInt<T>;
    }

    const output: Record<string, unknown> = {};
    const keys = Object.keys(record);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      output[key] = serializeBigInt(record[key]);
    }
    return output as SerializedBigInt<T>;
  }

  return value as SerializedBigInt<T>;
}
