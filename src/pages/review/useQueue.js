import { useCallback, useEffect, useRef, useState } from 'react';
import { getJson, sendJson } from '@/lib/useResource';
import { reviewState } from '@/lib/review';

const PAGE = 50;
const EMPTY_COUNTS = { all: 0, unreviewed: 0, approved: 0, rejected: 0 };
const FLAG_LABELS = {
  keyMayBeWrong: 'Students keep choosing the same wrong option',
  difficultyOff: 'The difficulty label looks off',
  oftenSkipped: 'Students often leave it blank',
  slowToAnswer: 'Students take long to answer it',
};

const countsOf = (questions) => questions.reduce((c, q) => ({ ...c, all: c.all + 1, [reviewState(q)]: c[reviewState(q)] + 1 }), { ...EMPTY_COUNTS });

// Loads the questions of a review source and keeps them in memory while the reviewer works.
//   source: { type: 'chapter' | 'subject' | 'unreviewed' | 'rejected' | 'test' | 'flagged', ...ids }
//   filter: all | unreviewed | approved | rejected (a status filter for chapter, subject and test sources)
// Chapter, subject and scope queues are paged by the server; tests and the flagged list are loaded whole.
export default function useQueue(source, filter, { board, classId }) {
  const [state, setState] = useState({ status: 'idle', questions: [], counts: EMPTY_COUNTS, total: 0, page: 0, title: '', flags: {}, error: '' });
  const generation = useRef(0);
  const key = JSON.stringify([source, filter, board, classId]);

  const serverFilter = source?.type === 'unreviewed' ? 'unreviewed' : source?.type === 'rejected' ? 'rejected' : filter;
  const isServerQueue = ['chapter', 'subject', 'unreviewed', 'rejected'].includes(source?.type);

  const fetchPage = useCallback(async (page) => {
    const q = new URLSearchParams({ page: String(page), limit: String(PAGE), filter: serverFilter });
    if (source.type === 'chapter') q.set('chapterId', source.chapterId);
    else if (source.type === 'subject') q.set('subjectId', source.subjectId);
    else { q.set('board', board); q.set('classId', String(classId)); }
    return getJson(`/review/queue?${q}`, undefined, { raw: true });
  }, [source, serverFilter, board, classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!source) return setState({ status: 'idle', questions: [], counts: EMPTY_COUNTS, total: 0, page: 0, title: '', flags: {}, error: '' });
    const mine = ++generation.current;
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    try {
      let next;
      if (isServerQueue) {
        const data = await fetchPage(1);
        next = { questions: data.questions, counts: data.counts, total: data.total, page: 1, flags: {} };
      } else if (source.type === 'test') {
        const data = await getJson(`/tests/${source.testId}/review-questions`, undefined, { raw: true });
        const all = data.questions || [];
        next = { questions: all, counts: countsOf(all), total: all.length, page: 1, flags: {}, title: data.test?.title ? `Mock test: ${data.test.title}` : 'Mock test' };
      } else {
        const insights = await getJson('/analytics/insights/questions?days=90', undefined, { raw: true });
        const order = ['keyMayBeWrong', 'difficultyOff', 'oftenSkipped', 'slowToAnswer'];
        const ids = [];
        const flags = {};
        order.forEach((lens) => (insights.lenses?.[lens] || []).forEach((row) => {
          if (!flags[row.questionId]) { flags[row.questionId] = []; ids.push(row.questionId); }
          flags[row.questionId].push({ lens, label: FLAG_LABELS[lens], row });
        }));
        const data = ids.length ? await sendJson('POST', '/review/by-ids', { ids: ids.slice(0, 100) }) : { questions: [] };
        next = { questions: data.questions, counts: countsOf(data.questions), total: data.questions.length, page: 1, flags };
      }
      if (mine !== generation.current) return;
      setState((s) => ({ ...s, ...next, status: 'ready' }));
    } catch (err) {
      if (mine === generation.current) setState((s) => ({ ...s, status: 'error', error: err.message || "Couldn't load the questions" }));
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const hasMore = isServerQueue && state.questions.length < state.total;
  const loadMore = useCallback(async () => {
    if (!hasMore || state.status === 'loadingMore') return;
    const mine = generation.current;
    setState((s) => ({ ...s, status: 'loadingMore' }));
    try {
      const data = await fetchPage(state.page + 1);
      if (mine !== generation.current) return;
      setState((s) => {
        const seen = new Set(s.questions.map((q) => q._id));
        return { ...s, status: 'ready', page: s.page + 1, total: data.total, counts: data.counts, questions: [...s.questions, ...data.questions.filter((q) => !seen.has(q._id))] };
      });
    } catch (err) {
      setState((s) => ({ ...s, status: 'ready', error: err.message }));
    }
  }, [hasMore, state.page, state.status, fetchPage]);

  // Record a decision locally and keep the status counts honest without refetching.
  const applyAudit = useCallback((id, audit) => {
    setState((s) => {
      const before = s.questions.find((q) => q._id === id);
      if (!before) return s;
      const from = reviewState(before);
      const to = audit?.status || 'unreviewed';
      const counts = from === to ? s.counts : { ...s.counts, [from]: Math.max(0, s.counts[from] - 1), [to]: s.counts[to] + 1 };
      return { ...s, counts, questions: s.questions.map((q) => (q._id === id ? { ...q, audit: audit || null } : q)) };
    });
  }, []);

  const replaceQuestion = useCallback((id, patch) => {
    setState((s) => ({ ...s, questions: s.questions.map((q) => (q._id === id ? { ...q, ...patch } : q)) }));
  }, []);

  return { ...state, isServerQueue, hasMore, loadMore, reload: load, applyAudit, replaceQuestion };
}

export { FLAG_LABELS };
