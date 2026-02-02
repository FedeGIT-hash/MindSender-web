import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  sender?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChatContextType {
  friendRequests: FriendRequest[];
  friends: any[]; // Simplified for now
  activeChat: string | null; // User ID of the friend we are chatting with
  messages: Message[];
  loading: boolean;
  sendFriendRequest: (email: string) => Promise<{ success: boolean; message: string }>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  setActiveChat: (userId: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (!user) return;
    refreshFriendRequests();
    fetchFriends();
  }, [user]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!user || !activeChat) return;

    // Fetch initial messages for this chat
    fetchMessages(activeChat);

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${activeChat}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`, // Listen for messages sent TO me
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          // Only add if it comes from the active chat user
          const newMessage = payload.new as Message;
          if (newMessage.sender_id === activeChat) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeChat]);

  const refreshFriendRequests = async () => {
    if (!user) return;
    
    // Get requests sent TO me
    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching friend requests:', error);
      return;
    }

    if (requests && requests.length > 0) {
      // Fetch profiles for senders
      const senderIds = requests.map((r: any) => r.sender_id);
      const { data: senders } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', senderIds);
        
      // Merge data
      const requestsWithSender = requests.map((req: any) => ({
        ...req,
        sender: senders?.find((s: any) => s.id === req.sender_id) || { email: 'Usuario desconocido' }
      }));

      setFriendRequests(requestsWithSender as FriendRequest[]);
    } else {
      setFriendRequests([]);
    }
  };

  const fetchFriends = async () => {
    if (!user) return;
    // Get accepted requests where I am sender OR receiver
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!error && data) {
      // Extract friend IDs
      const friendIds = data.map((req: any) => 
        req.sender_id === user.id ? req.receiver_id : req.sender_id
      );

      if (friendIds.length > 0) {
        // Fetch profiles for these IDs
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', friendIds);
          
        setFriends(profiles || []);
      } else {
        setFriends([]);
      }
    }
  };

  const fetchMessages = async (friendId: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }
  };

  const sendFriendRequest = async (email: string) => {
    if (!user) return { success: false, message: 'No autenticado' };

    try {
      // 1. Find user by email (using the RPC function we created in SQL)
      const { data: foundUsers, error: searchError } = await supabase
        .rpc('search_users_by_email', { search_term: email });

      if (searchError || !foundUsers || foundUsers.length === 0) {
        return { success: false, message: 'Usuario no encontrado' };
      }

      const targetUser = foundUsers[0] as any;

      if (targetUser.id === user.id) {
        return { success: false, message: 'No puedes enviarte solicitud a ti mismo' };
      }

      // 2. Check if request already exists
      const { data: existing } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user.id})`);

      if (existing && existing.length > 0) {
        return { success: false, message: 'Ya existe una solicitud o amistad' };
      }

      // 3. Send request
      const { error: insertError } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: targetUser.id,
          status: 'pending'
        });

      if (insertError) throw insertError;

      return { success: true, message: 'Solicitud enviada' };
    } catch (err: any) {
      console.error(err);
      return { success: false, message: err.message || 'Error al enviar solicitud' };
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    
    await refreshFriendRequests();
    await fetchFriends();
  };

  const rejectFriendRequest = async (requestId: string) => {
    await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
      
    await refreshFriendRequests();
  };

  const sendMessage = async (content: string) => {
    if (!user || !activeChat) return;

    // Optimistic update
    const newMessage: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: activeChat,
      content,
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    setMessages(prev => [...prev, newMessage]);

    const { error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id: activeChat,
        content
      });

    if (error) {
      // Rollback if needed, but for now simple log
      console.error('Error sending message', error);
    }
  };

  return (
    <ChatContext.Provider value={{
      friendRequests,
      friends,
      activeChat,
      messages,
      loading,
      sendFriendRequest,
      acceptFriendRequest,
      rejectFriendRequest,
      setActiveChat,
      sendMessage,
      refreshFriendRequests
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
