export function assetUrl(relativePath) {
  const trimmed = String(relativePath).replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${trimmed}`;
}
