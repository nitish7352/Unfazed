const apiUrl = import.meta.env.VITE_API_URL;
const apiOrigin = /^https?:\/\//i.test(apiUrl || '') ? new URL(apiUrl).origin : '';

export const getAssetUrl = (src) => {
  if (!src || /^(https?:|data:|blob:)/i.test(src)) return src;
  return `${apiOrigin}${src.startsWith('/') ? src : `/${src}`}`;
};
