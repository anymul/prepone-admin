// Parsing and validation of question CSV files. One format serves both import paths that used to be
// separate pages: into the chapter you are looking at (no subject/chapter columns needed), or across
// chapters (subject and chapter columns name the target; missing ones are created on import).

export const LANGUAGE_MODES = {
  both: { label: 'English and Hindi', requirement: 'both' },
  en_only: { label: 'English only', requirement: 'en_only' },
  hi_only: { label: 'Hindi only', requirement: 'hi_only' },
};

const LETTERS = { A: 0, B: 1, C: 2, D: 3 };
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const COLUMNS = {
  both: ['question_hi', 'optA_hi', 'optB_hi', 'optC_hi', 'optD_hi', 'question_en', 'optA_en', 'optB_en', 'optC_en', 'optD_en', 'correct_option', 'difficulty', 'marks', 'explanation_en', 'explanation_hi', 'subject', 'chapter'],
  en_only: ['question', 'optA', 'optB', 'optC', 'optD', 'correct_option', 'difficulty', 'marks', 'explanation', 'subject', 'chapter'],
  hi_only: ['question', 'optA', 'optB', 'optC', 'optD', 'correct_option', 'difficulty', 'marks', 'explanation', 'subject', 'chapter'],
};

const SAMPLES = {
  both: [
    'भारत की राजधानी क्या है?', 'मुंबई', 'नई दिल्ली', 'कोलकाता', 'चेन्नई',
    'What is the capital of India?', 'Mumbai', 'New Delhi', 'Kolkata', 'Chennai',
    'B', 'easy', '1', 'New Delhi is the capital of India.', 'नई दिल्ली भारत की राजधानी है।', 'Social Science', 'Geography',
  ],
  en_only: ['What is the capital of India?', 'Mumbai', 'New Delhi', 'Kolkata', 'Chennai', 'B', 'easy', '1', 'New Delhi is the capital of India.', 'Social Science', 'Geography'],
  hi_only: ['भारत की राजधानी क्या है?', 'मुंबई', 'नई दिल्ली', 'कोलकाता', 'चेन्नई', 'B', 'easy', '1', 'नई दिल्ली भारत की राजधानी है।', 'Social Science', 'Geography'],
};

export const templateRows = (mode) => [COLUMNS[mode] || COLUMNS.both, SAMPLES[mode] || SAMPLES.both];

const cell = (row, i) => String(row[i] ?? '').trim();

function readRow(row, mode) {
  if (mode === 'both') {
    return {
      questionText: { en: cell(row, 5), hi: cell(row, 0) },
      options: [0, 1, 2, 3].map((i) => ({ en: cell(row, 6 + i), hi: cell(row, 1 + i) })),
      correct: cell(row, 10), difficulty: cell(row, 11), marks: cell(row, 12),
      explanation: { en: cell(row, 13), hi: cell(row, 14) },
      subject: cell(row, 15), chapter: cell(row, 16),
    };
  }
  const lang = mode === 'hi_only' ? 'hi' : 'en';
  const other = lang === 'en' ? 'hi' : 'en';
  const pack = (text) => ({ [lang]: text, [other]: '' });
  return {
    questionText: pack(cell(row, 0)),
    options: [1, 2, 3, 4].map((i) => pack(cell(row, i))),
    correct: cell(row, 5), difficulty: cell(row, 6), marks: cell(row, 7),
    explanation: pack(cell(row, 8)),
    subject: cell(row, 9), chapter: cell(row, 10),
  };
}

const hasText = (value, mode) => {
  if (mode === 'both') return Boolean(value.en && value.hi);
  return Boolean(mode === 'hi_only' ? value.hi : value.en);
};

// "A".."D" or 0..3 (the master uploader also accepted indexes).
export function parseCorrectOption(raw) {
  const text = String(raw ?? '').trim().toUpperCase();
  if (text in LETTERS) return LETTERS[text];
  const n = Number.parseInt(text, 10);
  return Number.isInteger(n) && n >= 0 && n <= 3 && String(n) === text ? n : null;
}

// rows: Papa.parse output (array of arrays, first row is the header).
// target: { subjectId, chapterId } used for rows without subject/chapter columns.
export function parseQuestionRows(rows, { mode = 'both', target = null } = {}) {
  const errors = [];
  const groups = new Map();
  let total = 0;

  rows.slice(1).forEach((row, index) => {
    const line = index + 2;
    if (!row || row.every((c) => !String(c ?? '').trim())) return;
    const r = readRow(row, mode);

    const label = `Row ${line}`;
    if (!hasText(r.questionText, mode)) return errors.push(`${label}: the question text is missing${mode === 'both' ? ' in English or Hindi' : ''}.`);

    const correct = parseCorrectOption(r.correct);
    if (correct === null) return errors.push(`${label}: correct option "${r.correct}" must be A, B, C or D.`);

    const options = r.options.filter((o) => (mode === 'both' ? o.en && o.hi : o.en || o.hi));
    const original = r.options;
    if (options.length < 2) return errors.push(`${label}: at least 2 options are needed${mode === 'both' ? ' in both languages' : ''}.`);
    if (!(original[correct].en || original[correct].hi)) return errors.push(`${label}: option ${'ABCD'[correct]} is marked correct but is empty.`);

    // Keep the correct answer pointing at the same option after blank options are dropped.
    const kept = original.map((o, i) => ({ o, i })).filter(({ o }) => (mode === 'both' ? o.en && o.hi : o.en || o.hi));
    const correctOptionIndex = kept.findIndex(({ i }) => i === correct);
    if (correctOptionIndex < 0) return errors.push(`${label}: the correct option must have text${mode === 'both' ? ' in both languages' : ''}.`);

    let subject = r.subject;
    let chapter = r.chapter;
    if (!subject && !chapter) {
      if (!target) return errors.push(`${label}: no subject and chapter. Open a chapter first, or add subject and chapter columns.`);
      subject = null;
      chapter = null;
    } else if (!subject || !chapter) {
      return errors.push(`${label}: give both subject and chapter, or leave both empty.`);
    }

    const question = {
      questionType: 'MCQ',
      questionText: r.questionText,
      options: kept.map(({ o }) => o),
      correctOptionIndex,
      difficulty: DIFFICULTIES.includes(r.difficulty.toLowerCase()) ? r.difficulty.toLowerCase() : 'medium',
      marks: Number.parseInt(r.marks, 10) > 0 ? Number.parseInt(r.marks, 10) : 1,
      explanation: r.explanation,
    };

    const key = subject ? `${subject.toLowerCase()}||${chapter.toLowerCase()}` : '||';
    if (!groups.has(key)) groups.set(key, { subject, chapter, usesTarget: !subject, questions: [] });
    groups.get(key).questions.push(question);
    total += 1;
  });

  return { groups: [...groups.values()], errors, total };
}
