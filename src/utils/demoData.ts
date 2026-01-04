// Demo data utility
// This will be used when demo mode is enabled

export interface DemoContent {
  // Define your demo content structure here
  // This is a placeholder for future content
}

export function getDemoData(): DemoContent {
  // Return dummy data when demo mode is enabled
  return {} as DemoContent;
}

export function isDemoModeEnabled(): boolean {
  // Check if demo mode is enabled
  // This will be implemented using the DemoModeContext
  return false;
}
