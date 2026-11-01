// Helpers that tie the "working on Class N" scope to the class-based URLs the pages still use.

export const CLASSES = [10, 12];

const CLASS_PATHS = /^\/mock-tests\/(?:create\/)?(\d+)(?:\/|$)/;

// The class a URL is about, or null when the page is not class-specific.
export function classFromPath(pathname) {
  const m = pathname.match(CLASS_PATHS);
  return m ? Number(m[1]) : null;
}

// The equivalent page for another class, or null when the current page is not class-specific.
export function pathForClass(pathname, classId) {
  if (classFromPath(pathname) == null) return null;
  if (pathname.startsWith('/mock-tests/create/')) return `/mock-tests/create/${classId}`;
  if (pathname.startsWith('/mock-tests/')) return `/mock-tests/${classId}`;
  return null;
}
