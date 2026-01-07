import { useState } from 'react';

export function useUserProfileModal() {
  const [visible, setVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  function openProfile(userId: string) {
    setUserId(userId);
    setVisible(true);
  }

  function closeProfile() {
    setVisible(false);
    setUserId(null);
  }

  return {
    visible,
    userId: userId || undefined,
    openProfile,
    closeProfile,
  };
}

