import React, { useState, useEffect, useRef } from 'react';
import messageService from '../../utils/messageService';
import { useAuth } from '../../utils/hooks/useSupabase';
import Button from '../common/Button';
import { toast } from 'react-toastify';

function UserMessageBox() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId] = useState(() => user?.id || crypto.randomUUID());
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();

    subscriptionRef.current = messageService.subscribeToConversation(
      conversationId,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new]);
          if (payload.new.sender_id !== user?.id) {
            messageService.markAsRead(payload.new.id);
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(msg =>
            msg.id === payload.new.id ? payload.new : msg
          ));
        }
      }
    );

    return () => {
      if (subscriptionRef.current) {
        messageService.unsubscribe(subscriptionRef.current);
      }
    };
  }, [conversationId, user?.id]);

  const loadMessages = async () => {
    setLoading(true);
    const result = await messageService.getMessages(conversationId);
    if (result.success) {
      setMessages(result.data);
      result.data.forEach(msg => {
        if (!msg.read && msg.recipient_id === user?.id) {
          messageService.markAsRead(msg.id);
        }
      });
    }
    setLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const result = await messageService.sendMessage({
      recipientId: null,
      message: newMessage.trim(),
      conversationId
    });

    if (result.success) {
      setNewMessage('');
    } else {
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading messages...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg">
        <h2 className="text-xl font-bold flex items-center">
          <i className="fas fa-comment-alt mr-2"></i>
          Message Support
        </h2>
        <p className="text-sm text-green-100 mt-1">Chat with our admin team</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50" style={{ maxHeight: '500px' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <i className="fas fa-inbox text-4xl mb-4 text-gray-300"></i>
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.sender_id === user?.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {msg.sender_id !== user?.id && (
                  <div className="text-xs font-semibold mb-1 text-green-600">
                    Admin
                  </div>
                )}
                <p className="text-sm break-words">{msg.message}</p>
                <div
                  className={`text-xs mt-2 ${
                    msg.sender_id === user?.id ? 'text-green-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-6"
          >
            {sending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default UserMessageBox;
