import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DemoModeContextType {
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

const DEMO_MODE_STORAGE_KEY = '@hedronal:demoMode';

interface DemoModeProviderProps {
  children: ReactNode;
}

export function DemoModeProvider({ children }: DemoModeProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  React.useEffect(() => {
    async function loadDemoMode() {
      try {
        const saved = await AsyncStorage.getItem(DEMO_MODE_STORAGE_KEY);
        if (saved === 'true') {
          setIsDemoMode(true);
        }
      } catch (error) {
        console.error('Error loading demo mode:', error);
      }
    }
    loadDemoMode();
  }, []);

  const enableDemoMode = async () => {
    setIsDemoMode(true);
    try {
      await AsyncStorage.setItem(DEMO_MODE_STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Error saving demo mode:', error);
    }
  };

  const disableDemoMode = async () => {
    setIsDemoMode(false);
    try {
      await AsyncStorage.setItem(DEMO_MODE_STORAGE_KEY, 'false');
    } catch (error) {
      console.error('Error saving demo mode:', error);
    }
  };

  const toggleDemoMode = () => {
    if (isDemoMode) {
      disableDemoMode();
    } else {
      enableDemoMode();
    }
  };

  return (
    <DemoModeContext.Provider value={{ isDemoMode, enableDemoMode, disableDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode(): DemoModeContextType {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
