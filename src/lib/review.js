// Pure helpers for the question review workspace.

export const REJECT_REASONS = [
  'Incorrect answer',
  'Duplicate question',
  'LaTeX formatting broken',
  'Hindi translation missing',
  'Hindi translation mismatch',
  'Ambiguous question',
  'Wrong chapter',
  'Poor quality',
  'Wrong Hindi terminology',
];
export const APPROVE_NOTES = ['Good question', 'Fixed, then verified'];
export const MIN_REASON = 3;

export const reviewState = (q) => q?.audit?.status || 'unreviewed';
export const isDecided = (q) => reviewState(q) !== 'unreviewed';

// Index of the next question to look at when moving `dir` (1 or -1) from `from`.
// With onlyUnreviewed it skips decided questions; if none is left in that direction it returns -1.
export function stepIndex(list, from, dir, { onlyUnreviewed = false } = {}) {
  for (let i = from + dir; i >= 0 && i < list.length; i += dir) {
    if (!onlyUnreviewed || !isDecided(list[i])) return i;
  }
  return -1;
}

// After deciding the question at `from`: the next unreviewed one after it, else the next one at all, else stay.
export function advanceIndex(list, from) {
  const unreviewed = stepIndex(list, from, 1, { onlyUnreviewed: true });
  if (unreviewed !== -1) return unreviewed;
  const earlier = stepIndex(list, -1, 1, { onlyUnreviewed: true });
  if (earlier !== -1 && earlier !== from) return earlier;
  const next = stepIndex(list, from, 1);
  return next !== -1 ? next : from;
}

export const csvCell = (value) => {
  const text = value == null ? '' : String(value).replace(/\r?\n/g, ' ');
  return /[",]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Review log of the loaded questions. Spreadsheet apps read a leading BOM as UTF-8 (needed for Hindi text).
export function buildCsv(questions) {
  const header = ['Question id', 'Class', 'Subject', 'Chapter', 'Question (English)', 'Question (Hindi)', 'Status', 'Remark', 'Reviewed by', 'Reviewed at'];
  const rows = questions.map((q) => [
    q._id, q.studentClass ?? '', q.subjectName ?? '', q.chapterName ?? '', q.questionText?.en ?? '', q.questionText?.hi ?? '',
    reviewState(q), q.audit?.remark ?? '', q.audit?.reviewerName ?? '', q.audit?.timestamp ? new Date(q.audit.timestamp).toISOString() : '',
  ]);
  return `﻿${[header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')}`;
}

// An empty { en: '', hi: '' } and a missing value mean the same thing, so the AI filling in blanks is not a "change".
const normalize = (v) => (v && typeof v === 'object' && !Array.isArray(v) && 'en' in v && !String(v.en || '').trim() && !String(v.hi || '').trim() ? null : v ?? null);
const same = (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));

// Which parts of a question differ between the current version and an AI suggestion.
// Returns [{ key, label, before, after }] for question text, each option, explanation, and the answer key.
export function changedFields(before, after) {
  const out = [];
  const pair = (key, label, a, b) => { if (!same(a, b)) out.push({ key, label, before: a, after: b }); };
  pair('questionText', 'Question', before.questionText, after.questionText);
  const count = Math.max(before.options?.length || 0, after.options?.length || 0);
  for (let i = 0; i < count; i += 1) pair(`option${i}`, `Option ${'ABCDEFGH'[i] || i + 1}`, before.options?.[i], after.options?.[i]);
  pair('explanation', 'Explanation', before.explanation, after.explanation);
  if (after.correctOptionIndex !== undefined && after.correctOptionIndex !== null) {
    pair('correctOptionIndex', 'Correct answer', before.correctOptionIndex, after.correctOptionIndex);
  }
  return out;
}

// A suggestion that moves the answer key is dangerous and is called out to the reviewer.
export const changesAnswerKey = (before, after) =>
  after.correctOptionIndex !== undefined && after.correctOptionIndex !== null && before.correctOptionIndex !== after.correctOptionIndex;

// The PATCH body that applies a suggestion (only the parts that exist in it).
export function suggestionPatch(before, after) {
  const patch = {};
  if (!same(before.questionText, after.questionText) && after.questionText) patch.questionText = after.questionText;
  if (!same(before.options, after.options) && Array.isArray(after.options)) patch.options = after.options;
  if (!same(before.explanation, after.explanation) && after.explanation) patch.explanation = after.explanation;
  if (changesAnswerKey(before, after)) patch.correctOptionIndex = after.correctOptionIndex;
  return patch;
}
