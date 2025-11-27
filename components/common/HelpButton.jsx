import React from 'react';
import { useAuth } from '../../utils/hooks/useSupabase';

function HelpButton() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <a
      href="/messages?recipient=support"
      className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-40"
      aria-label="Contact Support"
      title="Contact Support"
    >
      <i className="fas fa-question text-xl"></i>
    </a>
  );
}

export default HelpButton;
