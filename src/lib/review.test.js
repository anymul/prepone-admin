// node --test src/lib/review.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceIndex, buildCsv, changedFields, changesAnswerKey, csvCell, isDecided, reviewState, stepIndex, suggestionPatch } from './review.js';

const q = (id, status) => ({ _id: id, ...(status ? { audit: { status } } : {}) });

test('review state reads missing and null audits as unreviewed', () => {
  assert.equal(reviewState(q('a')), 'unreviewed');
  assert.equal(reviewState({ audit: { status: null } }), 'unreviewed');
  assert.equal(reviewState(q('a', 'approved')), 'approved');
  assert.equal(isDecided(q('a', 'rejected')), true);
  assert.equal(isDecided(q('a')), false);
});

test('stepIndex moves one step, or to the next unreviewed question', () => {
  const list = [q('0', 'approved'), q('1'), q('2', 'rejected'), q('3'), q('4', 'approved')];
  assert.equal(stepIndex(list, 0, 1), 1);
  assert.equal(stepIndex(list, 1, 1, { onlyUnreviewed: true }), 3);
  assert.equal(stepIndex(list, 3, 1, { onlyUnreviewed: true }), -1);
  assert.equal(stepIndex(list, 3, -1, { onlyUnreviewed: true }), 1);
  assert.equal(stepIndex(list, 0, -1), -1);
  assert.equal(stepIndex(list, 4, 1), -1);
});

test('advanceIndex prefers the next unreviewed, then wraps to an earlier one, then the next question', () => {
  assert.equal(advanceIndex([q('0'), q('1', 'approved'), q('2')], 0), 2);
  assert.equal(advanceIndex([q('0'), q('1', 'approved'), q('2', 'approved')], 2), 0, 'wraps to an unreviewed one before it');
  assert.equal(advanceIndex([q('0', 'approved'), q('1', 'approved'), q('2', 'approved')], 1), 2, 'nothing unreviewed: just the next one');
  assert.equal(advanceIndex([q('0', 'approved')], 0), 0, 'the only question: stay');
});

test('csvCell quotes commas and quotes, flattens newlines', () => {
  assert.equal(csvCell('plain'), 'plain');
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('line1\nline2'), 'line1 line2');
  assert.equal(csvCell(null), '');
});

test('buildCsv writes a header, one row per question and keeps Hindi text', () => {
  const csv = buildCsv([
    { _id: '1', studentClass: 10, subjectName: 'Maths', chapterName: 'Real, Numbers', questionText: { en: 'What?', hi: 'क्या?' }, audit: { status: 'rejected', remark: 'wrong key', reviewerName: 'Asha', timestamp: '2026-11-01T10:00:00.000Z' } },
    { _id: '2', questionText: { en: 'Unreviewed' } },
  ]);
  const lines = csv.replace('﻿', '').split('\n');
  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^Question id,Class,Subject,Chapter/);
  assert.equal(lines[1], '1,10,Maths,"Real, Numbers",What?,क्या?,rejected,wrong key,Asha,2026-11-01T10:00:00.000Z');
  assert.match(lines[2], /,unreviewed,,,$/);
});

test('changedFields lists only what differs', () => {
  const before = { questionText: { en: 'x^2', hi: '' }, options: [{ en: 'a' }, { en: 'b' }], explanation: { en: 'e' }, correctOptionIndex: 0 };
  const after = { questionText: { en: '$x^2$', hi: '' }, options: [{ en: 'a' }, { en: '$b$' }], explanation: { en: 'e' }, correctOptionIndex: 0 };
  assert.deepEqual(changedFields(before, after).map((c) => c.key), ['questionText', 'option1']);
  assert.deepEqual(changedFields(before, before), []);
  assert.equal(changedFields(before, { ...after, correctOptionIndex: 1 }).at(-1).label, 'Correct answer');
});

test('an answer-key change is detected and included in the patch', () => {
  const before = { questionText: { en: 'q' }, options: [{ en: 'a' }, { en: 'b' }], correctOptionIndex: 0 };
  const moved = { ...before, correctOptionIndex: 1 };
  assert.equal(changesAnswerKey(before, moved), true);
  assert.equal(changesAnswerKey(before, before), false);
  assert.equal(changesAnswerKey(before, { ...before, correctOptionIndex: undefined }), false);
  assert.deepEqual(suggestionPatch(before, moved), { correctOptionIndex: 1 });
});

test('suggestionPatch only includes parts that changed', () => {
  const before = { questionText: { en: 'x^2' }, options: [{ en: 'a' }], explanation: { en: 'e' }, correctOptionIndex: 0 };
  const after = { questionText: { en: '$x^2$' }, options: [{ en: 'a' }], explanation: { en: 'e' }, correctOptionIndex: 0 };
  assert.deepEqual(suggestionPatch(before, after), { questionText: { en: '$x^2$' } });
  assert.deepEqual(suggestionPatch(before, before), {});
});

test('filling in an empty field is not a change', () => {
  const before = { questionText: { en: 'q', hi: '' }, explanation: undefined, options: [{ en: 'a' }], correctOptionIndex: 0 };
  const after = { questionText: { en: 'q', hi: '' }, explanation: { en: '', hi: '' }, options: [{ en: 'a' }], correctOptionIndex: 0 };
  assert.deepEqual(changedFields(before, after), []);
  assert.deepEqual(suggestionPatch(before, after), {});
});
