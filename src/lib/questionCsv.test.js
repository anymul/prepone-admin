// node --test src/lib/questionCsv.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCorrectOption, parseQuestionRows, templateRows } from './questionCsv.js';

const header = ['h'];
const both = (over = []) => {
  const row = ['प्रश्न', 'क', 'ख', 'ग', 'घ', 'Question', 'a', 'b', 'c', 'd', 'B', 'hard', '2', 'why', 'क्यों', '', ''];
  over.forEach(([i, v]) => { row[i] = v; });
  return row;
};

test('parseCorrectOption accepts letters and 0-3 only', () => {
  assert.equal(parseCorrectOption('b'), 1);
  assert.equal(parseCorrectOption(' D '), 3);
  assert.equal(parseCorrectOption('2'), 2);
  assert.equal(parseCorrectOption('4'), null);
  assert.equal(parseCorrectOption('E'), null);
  assert.equal(parseCorrectOption(''), null);
  assert.equal(parseCorrectOption('1.5'), null);
});

test('rows without subject/chapter go to the chosen chapter', () => {
  const { groups, errors, total } = parseQuestionRows([header, both()], { target: { chapterId: 'c1' } });
  assert.deepEqual(errors, []);
  assert.equal(total, 1);
  assert.equal(groups[0].usesTarget, true);
  const q = groups[0].questions[0];
  assert.equal(q.correctOptionIndex, 1);
  assert.equal(q.difficulty, 'hard');
  assert.equal(q.marks, 2);
  assert.deepEqual(q.questionText, { en: 'Question', hi: 'प्रश्न' });
  assert.deepEqual(q.explanation, { en: 'why', hi: 'क्यों' });
});

test('rows without a target and without subject/chapter are errors', () => {
  const { errors, total } = parseQuestionRows([header, both()]);
  assert.equal(total, 0);
  assert.match(errors[0], /Row 2: no subject and chapter/);
});

test('subject and chapter columns group rows, case-insensitively', () => {
  const rows = [header, both([[15, 'Math'], [16, 'Algebra']]), both([[15, 'math'], [16, 'ALGEBRA']]), both([[15, 'Math'], [16, 'Geometry']])];
  const { groups, total } = parseQuestionRows(rows);
  assert.equal(total, 3);
  assert.deepEqual(groups.map((g) => [g.subject, g.chapter, g.questions.length]), [['Math', 'Algebra', 2], ['Math', 'Geometry', 1]]);
});

test('only one of subject/chapter is an error', () => {
  const { errors } = parseQuestionRows([header, both([[15, 'Math']])], { target: { chapterId: 'c1' } });
  assert.match(errors[0], /both subject and chapter/);
});

test('blank options are dropped and the correct answer follows its option', () => {
  // option A (index 0) empty, correct is C (index 2) -> becomes index 1 after A is dropped
  const row = both([[6, ''], [1, ''], [10, 'C']]);
  const { groups, errors } = parseQuestionRows([header, row], { target: {} });
  assert.deepEqual(errors, []);
  const q = groups[0].questions[0];
  assert.equal(q.options.length, 3);
  assert.equal(q.options[q.correctOptionIndex].en, 'c');
});

test('a correct option that is empty is rejected', () => {
  const { errors } = parseQuestionRows([header, both([[8, ''], [3, ''], [10, 'C']])], { target: {} });
  assert.match(errors[0], /option C is marked correct but is empty/);
});

test('both-language mode needs English and Hindi; single-language modes need one', () => {
  assert.match(parseQuestionRows([header, both([[0, '']])], { target: {} }).errors[0], /question text is missing/);
  const en = ['What?', 'a', 'b', '', '', 'A', 'EASY', '', 'because', '', ''];
  const { groups, errors } = parseQuestionRows([header, en], { mode: 'en_only', target: {} });
  assert.deepEqual(errors, []);
  assert.equal(groups[0].questions[0].difficulty, 'easy');
  assert.equal(groups[0].questions[0].marks, 1);
  assert.deepEqual(groups[0].questions[0].questionText, { en: 'What?', hi: '' });
  const hi = ['क्या?', 'क', 'ख', '', '', 'B', '', '', '', '', ''];
  assert.equal(parseQuestionRows([header, hi], { mode: 'hi_only', target: {} }).total, 1);
});

test('unknown difficulty falls back to medium and bad marks to 1', () => {
  const { groups } = parseQuestionRows([header, both([[11, 'tricky'], [12, '0']])], { target: {} });
  assert.equal(groups[0].questions[0].difficulty, 'medium');
  assert.equal(groups[0].questions[0].marks, 1);
});

test('blank lines are skipped and row numbers match the file', () => {
  const rows = [header, Array(17).fill(''), both([[10, 'Z']])];
  const { errors, total } = parseQuestionRows(rows, { target: {} });
  assert.equal(total, 0);
  assert.match(errors[0], /^Row 3:/);
});

test('templates have a header and a sample for every mode', () => {
  for (const mode of ['both', 'en_only', 'hi_only']) {
    const [head, sample] = templateRows(mode);
    assert.equal(head.length, sample.length);
    const { errors, total } = parseQuestionRows([head, sample], { mode });
    assert.deepEqual(errors, [], mode);
    assert.equal(total, 1);
  }
});
