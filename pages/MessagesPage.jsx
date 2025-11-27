import React from 'react';
import UserMessageBox from '../components/messaging/UserMessageBox';
import { useAuth } from '../utils/hooks/useSupabase';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

function MessagesPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <Button onClick={() => navigate(-1)} variant="secondary">
          <i className="fas fa-arrow-left mr-2"></i>
          Back
        </Button>
      </div>
      <UserMessageBox />
    </div>
  );
}

export default MessagesPage;
