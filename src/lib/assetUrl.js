/**
 * Static files live in `public/` (e.g. `public/models`, `public/matcaps`).
 * They are served under Vite’s `base` URL, exposed as `import.meta.env.BASE_URL`.
 */
export function assetUrl(relativePath) {
  const trimmed = String(relativePath).replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${trimmed}`;
}
