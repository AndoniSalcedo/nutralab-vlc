'use client';

import { createContext, useContext } from 'react';

const PlayerDashboardContext = createContext({ user: null });

export function PlayerDashboardProvider({ children, user }) {
  return (
    <PlayerDashboardContext.Provider value={{ user }}>
      {children}
    </PlayerDashboardContext.Provider>
  );
}

export function usePlayerDashboard() {
  return useContext(PlayerDashboardContext);
}
