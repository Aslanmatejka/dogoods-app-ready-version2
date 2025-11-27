import React, { useState, useEffect, useRef } from 'react';
import messageService from '../utils/messageService';
import { useAuth } from '../utils/hooks/useSupabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button';
import supabase from '../utils/supabaseClient';
import { toast } from 'react-toastify';

function UserMessagesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadConversations();
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    const recipientId = searchParams.get('recipient');
    if (recipientId && conversations.length > 0) {
      const existingConv = conversations.find(
        conv => conv.other_user?.id === recipientId
      );
      if (existingConv) {
        setSelectedConversation(existingConv);
      } else {
        startNewConversation(recipientId);
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.conversation_id);

      if (subscriptionRef.current) {
        messageService.unsubscribe(subscriptionRef.current);
      }

      subscriptionRef.current = messageService.subscribeToConversation(
        selectedConversation.conversation_id,
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
    }

    return () => {
      if (subscriptionRef.current) {
        messageService.unsubscribe(subscriptionRef.current);
      }
    };
  }, [selectedConversation, user?.id]);

  const startNewConversation = async (recipientId) => {
    if (recipientId === 'support') {
      const { data: admins } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('is_admin', true)
        .limit(1)
        .single();

      if (admins) {
        const newConvId = crypto.randomUUID();
        setSelectedConversation({
          conversation_id: newConvId,
          other_user: { ...admins, name: 'Support Team', email: admins.email },
          last_message: '',
          last_message_time: new Date().toISOString(),
          unread_count: 0
        });
      } else {
        const newConvId = crypto.randomUUID();
        setSelectedConversation({
          conversation_id: newConvId,
          other_user: { name: 'Support Team', email: 'support@dogoods.com' },
          last_message: '',
          last_message_time: new Date().toISOString(),
          unread_count: 0
        });
      }
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .eq('id', recipientId)
      .single();

    if (userData) {
      const newConvId = crypto.randomUUID();
      setSelectedConversation({
        conversation_id: newConvId,
        other_user: userData,
        last_message: '',
        last_message_time: new Date().toISOString(),
        unread_count: 0
      });
    }
  };

  const loadConversations = async () => {
    setLoading(true);
    const result = await messageService.getConversations();
    if (result.success) {
      setConversations(result.data);
    }
    setLoading(false);
  };

  const loadMessages = async (conversationId) => {
    const result = await messageService.getMessages(conversationId);
    if (result.success) {
      setMessages(result.data);
      await messageService.markConversationAsRead(conversationId);
      loadConversations();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    const result = await messageService.sendMessage({
      recipientId: selectedConversation.other_user?.id || null,
      message: newMessage.trim(),
      conversationId: selectedConversation.conversation_id
    });

    if (result.success) {
      setNewMessage('');
      if (conversations.findIndex(c => c.conversation_id === selectedConversation.conversation_id) === -1) {
        loadConversations();
      }
    } else {
      toast.error('Failed to send message');
    }
    setSending(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          Loading conversations...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fas fa-comments mr-2 text-green-600"></i>
            Messages
          </h1>
          <Button onClick={() => navigate(-1)} variant="secondary">
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">
                Conversations ({conversations.length})
              </h2>
              <Button
                onClick={() => startNewConversation('support')}
                variant="primary"
                size="sm"
              >
                <i className="fas fa-plus mr-2"></i>
                New
              </Button>
            </div>
            {conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <i className="fas fa-inbox text-4xl mb-4 text-gray-300"></i>
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Click "New" to start a conversation</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedConversation?.conversation_id === conv.conversation_id
                        ? 'bg-green-50 border-2 border-green-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold mr-3">
                          {conv.other_user?.name?.[0]?.toUpperCase() || conv.other_user?.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {conv.other_user?.name || conv.other_user?.email || 'Admin'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(conv.last_message_time).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg mr-4">
                    {selectedConversation.other_user?.name?.[0]?.toUpperCase() ||
                     selectedConversation.other_user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.other_user?.name || selectedConversation.other_user?.email || 'Admin'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.other_user?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <i className="fas fa-comment text-4xl mb-4 text-gray-300"></i>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-lg ${
                          msg.sender_id === user?.id
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}
                      >
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

              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <i className="fas fa-comments text-6xl mb-4 text-gray-300"></i>
                <p className="text-lg">Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserMessagesPage;
