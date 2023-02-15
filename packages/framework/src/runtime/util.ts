export function arrayPush<T>(target: T[], other: T[]): T[] {
  // Pre allocate
  const originalTargetLength = target.length;
  const otherLength = other.length;
  target.length = originalTargetLength + otherLength;

  for (let i = 0; i < otherLength; i++) {
    target[originalTargetLength + i] = other[i];
  }
  return target;
}

export function lowercaseKeys<T>(obj: {[key: string]: T}): { [key: string]: T } {
  const keys = Object.keys(obj);
  const n = keys.length;
  for (let i =0; i<n;i++) {
    const key = keys[i];
    const val = obj[key];
    delete obj[key];
    obj[key.toLowerCase()] = val;
  }
  return obj;
}
