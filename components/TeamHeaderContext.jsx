'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

const TeamHeaderSlotContext = createContext(null);

export function TeamHeaderSlotProvider({ children }) {
  const [rightSlotEl, setRightSlotElState] = useState(null);
  const [desktopRightSlotEl, setDesktopRightSlotElState] = useState(null);
  const [mobileRightSlotEl, setMobileRightSlotElState] = useState(null);
  const [desktopFiltersSlotEl, setDesktopFiltersSlotElState] = useState(null);
  const [mobileFiltersSlotEl, setMobileFiltersSlotElState] = useState(null);
  const [hasRightSection, setHasRightSection] = useState(false);
  const [hasDesktopRightSection, setHasDesktopRightSection] = useState(false);
  const [hasMobileRightSection, setHasMobileRightSection] = useState(false);
  const [hasDesktopFilters, setHasDesktopFilters] = useState(false);
  const [hasMobileFilters, setHasMobileFilters] = useState(false);

  const setRightSlotEl = useCallback((el) => {
    setRightSlotElState(el);
  }, []);

  const setDesktopRightSlotEl = useCallback((el) => {
    setDesktopRightSlotElState(el);
  }, []);

  const setMobileRightSlotEl = useCallback((el) => {
    setMobileRightSlotElState(el);
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
    if (!desktopRightSlotEl) return;
    const checkDesktopRight = () => {
      setHasDesktopRightSection(desktopRightSlotEl.childNodes.length > 0);
    };
    checkDesktopRight();
    const observer = new MutationObserver(checkDesktopRight);
    observer.observe(desktopRightSlotEl, { childList: true });
    return () => observer.disconnect();
  }, [desktopRightSlotEl]);

  useEffect(() => {
    if (!mobileRightSlotEl) return;
    const checkMobileRight = () => {
      setHasMobileRightSection(mobileRightSlotEl.childNodes.length > 0);
    };
    checkMobileRight();
    const observer = new MutationObserver(checkMobileRight);
    observer.observe(mobileRightSlotEl, { childList: true });
    return () => observer.disconnect();
  }, [mobileRightSlotEl]);

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
        desktopRightSlotEl,
        mobileRightSlotEl,
        desktopFiltersSlotEl,
        mobileFiltersSlotEl,
        setRightSlotEl,
        setDesktopRightSlotEl,
        setMobileRightSlotEl,
        setDesktopFiltersSlotEl,
        setMobileFiltersSlotEl,
        hasRightSection: hasRightSection || hasDesktopRightSection || hasMobileRightSection,
        hasDesktopRightSection,
        hasMobileRightSection,
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
  const isDesktop = useMediaQuery('(min-width: 48em)', false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const target = isDesktop
    ? (context?.desktopRightSlotEl || context?.rightSlotEl)
    : (context?.mobileRightSlotEl || context?.rightSlotEl);

  if (!mounted || !target) return null;
  return createPortal(children, target);
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
