'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

const TeamHeaderSlotContext = createContext(null);

export function TeamHeaderSlotProvider({ children }) {
  const [rightSlotEl, setRightSlotElState] = useState(null);
  const [desktopFiltersSlotEl, setDesktopFiltersSlotElState] = useState(null);
  const [mobileFiltersSlotEl, setMobileFiltersSlotElState] = useState(null);
  const [hasRightSection, setHasRightSection] = useState(false);
  const [hasDesktopFilters, setHasDesktopFilters] = useState(false);
  const [hasMobileFilters, setHasMobileFilters] = useState(false);

  const setRightSlotEl = useCallback((el) => {
    setRightSlotElState(el);
  }, []);

  const setDesktopFiltersSlotEl = useCallback((el) => {
    setDesktopFiltersSlotElState(el);
  }, []);

  const setMobileFiltersSlotEl = useCallback((el) => {
    setMobileFiltersSlotElState(el);
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
    if (!desktopFiltersSlotEl) return;
    const checkFilters = () => {
      setHasDesktopFilters(desktopFiltersSlotEl.childNodes.length > 0);
    };
    checkFilters();
    const observer = new MutationObserver(checkFilters);
    observer.observe(desktopFiltersSlotEl, { childList: true });
    return () => observer.disconnect();
  }, [desktopFiltersSlotEl]);

  useEffect(() => {
    if (!mobileFiltersSlotEl) return;
    const checkFilters = () => {
      setHasMobileFilters(mobileFiltersSlotEl.childNodes.length > 0);
    };
    checkFilters();
    const observer = new MutationObserver(checkFilters);
    observer.observe(mobileFiltersSlotEl, { childList: true });
    return () => observer.disconnect();
  }, [mobileFiltersSlotEl]);

  return (
    <TeamHeaderSlotContext.Provider
      value={{
        rightSlotEl,
        desktopFiltersSlotEl,
        mobileFiltersSlotEl,
        setRightSlotEl,
        setDesktopFiltersSlotEl,
        setMobileFiltersSlotEl,
        hasRightSection,
        hasDesktopFilters,
        hasMobileFilters,
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
  const isDesktop = useMediaQuery('(min-width: 48em)', false);
  const target = isDesktop ? context?.desktopFiltersSlotEl : context?.mobileFiltersSlotEl;
  const content = <Box style={{ width: '100%', minWidth: 0 }}>{children}</Box>;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !target) return null;
  return createPortal(content, target);
}
