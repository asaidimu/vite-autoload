/**
 * Checks if a given module ID corresponds to a JavaScript-like file type.
 *
 * @param id - The module ID to check.
 * @returns True if the ID indicates a JavaScript-like module, false otherwise.
 */
export const isJavaScriptLikeModule = (id: string): boolean => {
  // Remove query parameters and hash
  const cleanId = id.split("?")[0].split("#")[0];

  return /\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(cleanId);
};
