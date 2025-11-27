import supabase from './supabaseClient';

class MessageService {
  async sendMessage({ recipientId = null, message, conversationId }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      const isAdmin = userData?.is_admin || false;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          message,
          conversation_id: conversationId,
          is_admin_sender: isAdmin,
          read: false
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  async getConversations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      const isAdmin = userData?.is_admin || false;

      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, name, email, avatar_url),
          recipient:recipient_id(id, name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id},and(recipient_id.is.null,is_admin_sender.eq.false)`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const conversationMap = new Map();

      data.forEach(msg => {
        const convId = msg.conversation_id;
        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            conversation_id: convId,
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: 0,
            other_user: msg.sender_id === user.id ? msg.recipient : msg.sender,
            is_admin_conversation: msg.is_admin_sender || (msg.recipient && msg.recipient.is_admin)
          });
        }

        if (!msg.read && msg.recipient_id === user.id) {
          conversationMap.get(convId).unread_count++;
        }
      });

      return {
        success: true,
        data: Array.from(conversationMap.values()).sort((a, b) =>
          new Date(b.last_message_time) - new Date(a.last_message_time)
        )
      };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return { success: false, error: error.message };
    }
  }

  async getMessages(conversationId) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, name, email, avatar_url),
          recipient:recipient_id(id, name, email, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message };
    }
  }

  async markAsRead(messageId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  }

  async markConversationAsRead(conversationId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return { success: false, error: error.message };
    }
  }

  subscribeToConversation(conversationId, callback) {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        callback
      )
      .subscribe();

    return subscription;
  }

  unsubscribe(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}

export default new MessageService();
