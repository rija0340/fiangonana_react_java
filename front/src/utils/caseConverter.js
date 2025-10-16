/**
 * Converts snake_case keys to camelCase
 * @param {Object} obj - Object with snake_case keys
 * @returns {Object} - Object with camelCase keys
 */
export const snakeToCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamelCase(item));
  }
  
  const converted = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Convert snake_case to camelCase
      const camelCaseKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      converted[camelCaseKey] = snakeToCamelCase(obj[key]);
    }
  }
  return converted;
};

/**
 * Converts camelCase keys to snake_case
 * @param {Object} obj - Object with camelCase keys
 * @returns {Object} - Object with snake_case keys
 */
export const camelToSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnakeCase(item));
  }
  
  const converted = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Convert camelCase to snake_case
      const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      converted[snakeCaseKey] = camelToSnakeCase(obj[key]);
    }
  }
  return converted;
};