export var API_BASE = import.meta.env.VITE_API_URL || "";

export function resolveFileUrl(fileUrl) {
  if (!fileUrl) return "";
  if (fileUrl.indexOf("http://") === 0 || fileUrl.indexOf("https://") === 0) {
    return fileUrl;
  }
  return API_BASE + fileUrl;
}