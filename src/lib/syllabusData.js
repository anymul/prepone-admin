import { getJson } from './useResource';

// A chapter with at least this many questions counts as well covered.
export const HEALTHY_MIN = 20;
export const levelOf = (n) => (n >= HEALTHY_MIN ? 'full' : n > 0 ? 'half' : 'none');

// Subjects for a board and class, each with its chapters (ordered) and their question counts.
// `/utility/subject` lists every subject for an admin, so board and class are filtered here.
export async function loadSyllabus(board, classId, signal) {
  const all = await getJson('/utility/subject', signal);
  const subjects = (Array.isArray(all) ? all : [])
    .filter((s) => s.board === board && Number(s.studentClass) === classId)
    .sort((a, b) => a.name.localeCompare(b.name));

  return Promise.all(subjects.map(async (subject) => {
    try {
      const chapters = await getJson(`/utility/chapters/subject/${subject._id}`, signal);
      return { ...subject, chapters: (Array.isArray(chapters) ? chapters : []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), failed: false };
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      return { ...subject, chapters: [], failed: true };
    }
  }));
}

export const totalsOf = (subject) => ({
  questions: subject.chapters.reduce((s, c) => s + (c.questionCount || 0), 0),
  empty: subject.chapters.filter((c) => !c.questionCount).length,
});
