'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const TeamHeaderSlotContext = createContext(null);

export function TeamHeaderSlotProvider({ children }) {
  const [rightSlotEl, setRightSlotElState] = useState(null);
  const [filtersSlotEl, setFiltersSlotElState] = useState(null);
  const [hasRightSection, setHasRightSection] = useState(false);
  const [hasFilters, setHasFilters] = useState(false);

  const setRightSlotEl = useCallback((el) => {
    setRightSlotElState(el);
  }, []);

  const setFiltersSlotEl = useCallback((el) => {
    setFiltersSlotElState(el);
  }, []);

  useEffect(() => {
    if (!rightSlotEl) return;
    const checkRight = () => {
      setHasRightSection(rightSlotEl.childNodes.length > 0);
    };
    checkRight();
    const observer = new MutationObserver(checkRight);
    observer.observe(rightSlotEl, { childList: true });
    return () => observer.disconnect();
  }, [rightSlotEl]);

  useEffect(() => {
    if (!filtersSlotEl) return;
    const checkFilters = () => {
      setHasFilters(filtersSlotEl.childNodes.length > 0);
    };
    checkFilters();
    const observer = new MutationObserver(checkFilters);
    observer.observe(filtersSlotEl, { childList: true });
    return () => observer.disconnect();
  }, [filtersSlotEl]);

  return (
    <TeamHeaderSlotContext.Provider
      value={{
        rightSlotEl,
        filtersSlotEl,
        setRightSlotEl,
        setFiltersSlotEl,
        hasRightSection,
        hasFilters,
      }}
    >
      {children}
    </TeamHeaderSlotContext.Provider>
  );
}

export function useTeamHeaderSlot() {
  return useContext(TeamHeaderSlotContext);
}

export function TeamHeaderRightSection({ children }) {
  const context = useTeamHeaderSlot();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !context?.rightSlotEl) return null;
  return createPortal(children, context.rightSlotEl);
}

export function TeamHeaderFilters({ children }) {
  const context = useTeamHeaderSlot();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !context?.filtersSlotEl) return null;
  return createPortal(children, context.filtersSlotEl);
}

