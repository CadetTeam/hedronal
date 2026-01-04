import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TabBarContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

interface TabBarProviderProps {
  children: ReactNode;
}

export function TabBarProvider({ children }: TabBarProviderProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  function triggerRefresh() {
    setRefreshKey((prev) => prev + 1);
  }

  return (
    <TabBarContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBar() {
  const context = useContext(TabBarContext);
  if (context === undefined) {
    throw new Error('useTabBar must be used within a TabBarProvider');
  }
  return context;
}
