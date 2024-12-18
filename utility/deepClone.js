export function deepClone(value){
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const target = Array.isArray(value) ? [] : {};

  for (const key in value) {
    target[key] = deepClone(value[key]);
  }

  return target;
}
