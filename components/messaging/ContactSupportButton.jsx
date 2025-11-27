import React from 'react';
import Button from '../common/Button';
import { useNavigate } from 'react-router-dom';

function ContactSupportButton({ className = '' }) {
  const navigate = useNavigate();

  const handleContactSupport = () => {
    navigate('/messages?recipient=support');
  };

  return (
    <Button
      onClick={handleContactSupport}
      variant="secondary"
      size="sm"
      className={className}
    >
      <i className="fas fa-life-ring mr-2"></i>
      Contact Support
    </Button>
  );
}

export default ContactSupportButton;
