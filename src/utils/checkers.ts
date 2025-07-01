export const isJavaScriptLikeModule = (id: string): boolean => {
  // Remove query parameters and hash
  const cleanId = id.split("?")[0].split("#")[0];

  return /\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(cleanId);
};
