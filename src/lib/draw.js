// Pure helpers for generating a mock test from a per-chapter question plan.

export const QUESTION_TYPES = ['MCQ', 'VeryShortSubjective', 'ShortSubjective', 'LongSubjective', 'CompetencyBased'];
export const TYPE_LABELS = {
  MCQ: 'Multiple choice',
  VeryShortSubjective: 'Very short answer',
  ShortSubjective: 'Short answer',
  LongSubjective: 'Long answer',
  CompetencyBased: 'Competency based',
};
export const typeOf = (q) => q.questionType || 'MCQ';

// plan: { [chapterId]: { [questionType]: count } }
// Draws random questions that satisfy the plan. Questions already used in other tests are skipped when
// `avoidUsed` is set, and anything the plan asked for but could not be found is reported in `shortfalls`.
export function drawQuestions(candidates, plan, { used = new Set(), avoidUsed = true, types = QUESTION_TYPES, rng = Math.random } = {}) {
  const picked = [];
  const shortfalls = [];

  for (const [chapterId, byType] of Object.entries(plan)) {
    for (const type of types) {
      const wanted = Number(byType?.[type]) || 0;
      if (wanted <= 0) continue;
      const pool = candidates.filter((q) => String(q.chapterId?._id ?? q.chapterId) === chapterId && typeOf(q) === type && !(avoidUsed && used.has(q._id)));
      const shuffled = shuffle(pool, rng);
      const got = shuffled.slice(0, wanted);
      picked.push(...got);
      if (got.length < wanted) shortfalls.push({ chapterId, type, wanted, got: got.length });
    }
  }
  return { picked, shortfalls };
}

export function shuffle(list, rng = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Spreads each section of an official paper pattern evenly across the chapters (the first chapters take the
// remainder). `sections`: [{ type, count }]. Returns a new plan; types not in `types` are ignored.
export function distributeEvenly(sections, chapterIds, types = QUESTION_TYPES) {
  const plan = Object.fromEntries(chapterIds.map((id) => [id, {}]));
  if (chapterIds.length === 0) return plan;
  for (const { type, count } of sections) {
    if (!types.includes(type)) continue;
    const base = Math.floor(count / chapterIds.length);
    const extra = count % chapterIds.length;
    chapterIds.forEach((id, i) => {
      const n = base + (i < extra ? 1 : 0);
      if (n > 0) plan[id][type] = (plan[id][type] || 0) + n;
    });
  }
  return plan;
}

export const planTotal = (plan, types = QUESTION_TYPES) =>
  Object.values(plan).reduce((sum, byType) => sum + types.reduce((s, t) => s + (Number(byType?.[t]) || 0), 0), 0);

// Passing marks are stored as an absolute number of marks.
export const passingMarksFor = (totalMarks, percent) => Math.ceil(totalMarks * (percent / 100));
export const passingPercentFor = (totalMarks, passingMarks) => (totalMarks > 0 ? Math.round((passingMarks / totalMarks) * 100) : 33);

// Stable order for showing a selection: by type, then subject/chapter as given.
export const sortByType = (questions) => [...questions].sort((a, b) => QUESTION_TYPES.indexOf(typeOf(a)) - QUESTION_TYPES.indexOf(typeOf(b)));
