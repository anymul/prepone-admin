// node --test src/lib/draw.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { distributeEvenly, drawQuestions, passingMarksFor, passingPercentFor, planTotal, shuffle, sortByType } from './draw.js';

const q = (id, chapterId, questionType = 'MCQ') => ({ _id: id, chapterId, questionType });
const counter = () => { let i = 0; return () => ((i += 1) * 0.37) % 1; };

test('draws the requested number per chapter and type', () => {
  const pool = [q('a', 'c1'), q('b', 'c1'), q('c', 'c1'), q('d', 'c2'), q('e', 'c1', 'ShortSubjective')];
  const { picked, shortfalls } = drawQuestions(pool, { c1: { MCQ: 2, ShortSubjective: 1 }, c2: { MCQ: 1 } }, { rng: counter() });
  assert.equal(picked.length, 4);
  assert.equal(picked.filter((x) => x.chapterId === 'c1' && x.questionType === 'MCQ').length, 2);
  assert.ok(picked.some((x) => x._id === 'e'));
  assert.deepEqual(shortfalls, []);
});

test('reports a shortfall instead of failing when a chapter has too few questions', () => {
  const { picked, shortfalls } = drawQuestions([q('a', 'c1')], { c1: { MCQ: 3 } });
  assert.equal(picked.length, 1);
  assert.deepEqual(shortfalls, [{ chapterId: 'c1', type: 'MCQ', wanted: 3, got: 1 }]);
});

test('skips questions used in other tests only when asked to', () => {
  const pool = [q('a', 'c1'), q('b', 'c1')];
  const used = new Set(['a']);
  assert.deepEqual(drawQuestions(pool, { c1: { MCQ: 2 } }, { used, avoidUsed: true }).picked.map((x) => x._id), ['b']);
  assert.equal(drawQuestions(pool, { c1: { MCQ: 2 } }, { used, avoidUsed: false }).picked.length, 2);
});

test('only the allowed question types are drawn', () => {
  const pool = [q('a', 'c1'), q('b', 'c1', 'LongSubjective')];
  const { picked } = drawQuestions(pool, { c1: { MCQ: 1, LongSubjective: 1 } }, { types: ['MCQ'] });
  assert.deepEqual(picked.map((x) => x._id), ['a']);
});

test('chapter ids may be populated objects', () => {
  const pool = [{ _id: 'a', chapterId: { _id: 'c1', name: 'X' }, questionType: 'MCQ' }];
  assert.equal(drawQuestions(pool, { c1: { MCQ: 1 } }).picked.length, 1);
});

test('shuffle keeps every item and does not mutate the input', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, counter());
  assert.deepEqual([...out].sort(), input);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
});

test('a section is spread evenly, remainders go to the first chapters', () => {
  const plan = distributeEvenly([{ type: 'MCQ', count: 10 }, { type: 'LongSubjective', count: 2 }], ['c1', 'c2', 'c3']);
  assert.deepEqual(plan, { c1: { MCQ: 4, LongSubjective: 1 }, c2: { MCQ: 3, LongSubjective: 1 }, c3: { MCQ: 3 } });
  assert.equal(planTotal(plan), 12);
});

test('sections of types that are not allowed are ignored; no chapters gives an empty plan', () => {
  assert.deepEqual(distributeEvenly([{ type: 'LongSubjective', count: 4 }], ['c1'], ['MCQ']), { c1: {} });
  assert.deepEqual(distributeEvenly([{ type: 'MCQ', count: 4 }], []), {});
});

test('passing marks round up and convert back', () => {
  assert.equal(passingMarksFor(80, 33), 27);
  assert.equal(passingMarksFor(100, 33), 33);
  assert.equal(passingPercentFor(80, 27), 34);
  assert.equal(passingPercentFor(0, 0), 33);
});

test('sortByType orders by type and keeps order within a type', () => {
  const sorted = sortByType([q('a', 'c', 'LongSubjective'), q('b', 'c'), q('c', 'c')]);
  assert.deepEqual(sorted.map((x) => x._id), ['b', 'c', 'a']);
});
