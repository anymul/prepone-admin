import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CLASSES } from './scopeRoutes';

// The board and class the admin is currently working on. It follows them across pages and reloads, so
// pages stop asking for it again.
export const BOARDS = ['BSEB', 'CBSE'];
const CLASS_KEY = 'scope.classId';
const BOARD_KEY = 'scope.board';
const ScopeContext = createContext(null);

const read = (key, allowed, fallback, parse = (v) => v) => {
  try {
    const value = parse(localStorage.getItem(key));
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try { localStorage.setItem(key, String(value)); } catch { /* storage unavailable */ }
};

export function ScopeProvider({ children }) {
  const [classId, setClassIdState] = useState(() => read(CLASS_KEY, CLASSES, CLASSES[0], Number));
  const [board, setBoardState] = useState(() => read(BOARD_KEY, BOARDS, BOARDS[0]));

  const setClassId = useCallback((value) => {
    const n = Number(value);
    if (!CLASSES.includes(n)) return;
    setClassIdState(n);
    write(CLASS_KEY, n);
  }, []);

  const setBoard = useCallback((value) => {
    if (!BOARDS.includes(value)) return;
    setBoardState(value);
    write(BOARD_KEY, value);
  }, []);

  const value = useMemo(() => ({ classId, setClassId, board, setBoard }), [classId, setClassId, board, setBoard]);
  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export const useScope = () => useContext(ScopeContext);
