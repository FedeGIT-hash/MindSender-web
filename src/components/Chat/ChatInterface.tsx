import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { X, UserPlus, MessageCircle, Send, Users, UserCheck } from 'lucide-react';
import gsap from 'gsap';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const { 
    friends, 
    friendRequests, 
    activeChat, 
    setActiveChat, 
    messages, 
    sendMessage, 
    sendFriendRequest, 
    acceptFriendRequest,
    isTyping,
    sendTypingEvent
  } = useChat();
  
  const [activeTab, setActiveTab] = useState<'chats' | 'friends' | 'add'>('chats');
  const [searchEmail, setSearchEmail] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [searchStatus, setSearchStatus] = useState<{success: boolean; message: string} | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // GSAP Animations
  useEffect(() => {
    if (isOpen) {
      gsap.to(containerRef.current, {
        x: 0,
        duration: 0.5,
        ease: 'power3.out'
      });
    } else {
      gsap.to(containerRef.current, {
        x: '100%',
        duration: 0.4,
        ease: 'power3.in'
      });
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchStatus({ success: false, message: 'Enviando...' });
    const result = await sendFriendRequest(searchEmail);
    setSearchStatus(result);
    if (result.success) setSearchEmail('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    await sendMessage(messageInput);
    setMessageInput('');
  };

  return (
    <div 
      ref={containerRef}
      className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white/95 backdrop-blur-xl shadow-2xl z-50 border-l border-white/20 transform translate-x-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          MindChat
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      {!activeChat && (
        <div className="flex p-2 gap-2 bg-gray-50/50">
          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'chats' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Chats
          </button>
          <button 
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'friends' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Amigos
            {friendRequests.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 rounded-full">{friendRequests.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'add' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Añadir
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="h-[calc(100%-130px)] overflow-y-auto">
        {/* Active Chat View */}
        {activeChat ? (
          <div className="flex flex-col h-full">
            <div className="p-3 bg-gray-50 border-b flex items-center gap-3">
              <button onClick={() => setActiveChat(null)} className="text-sm text-gray-500 hover:text-gray-800">
                ← Volver
              </button>
              <span className="font-semibold text-gray-700">Chat Activo</span>
            </div>
            
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                  <p>Di hola 👋</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender_id === activeChat ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.sender_id === activeChat 
                          ? 'bg-white text-gray-800 shadow-sm rounded-tl-none' 
                          : 'bg-emerald-500 text-white shadow-emerald-200 shadow-md rounded-tr-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-gray-200 text-gray-500 text-xs py-1 px-3 rounded-full flex items-center gap-1">
                    <span>Escribiendo</span>
                    <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  sendTypingEvent();
                }}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-gray-50"
              />
              <button 
                type="submit" 
                className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          // Tab Views
          <div className="p-4">
            {activeTab === 'chats' && (
              <div className="space-y-2">
                {friends.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No tienes chats aún.</p>
                    <p className="text-sm">¡Añade amigos para empezar!</p>
                  </div>
                ) : (
                  friends.map((friend) => (
                    <div 
                      key={friend.id}
                      onClick={() => setActiveChat(friend.id)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                        {friend.full_name?.[0] || friend.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{friend.full_name || 'Usuario'}</h3>
                        <p className="text-xs text-gray-500 truncate">{friend.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'friends' && (
              <div className="space-y-4">
                {/* Requests Section */}
                {friendRequests.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Solicitudes Pendientes</h3>
                    {friendRequests.map((req) => (
                      <div key={req.id} className="bg-white border border-emerald-100 p-3 rounded-xl shadow-sm mb-2">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {req.sender?.email || 'Alguien'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => acceptFriendRequest(req.id)}
                            className="flex-1 bg-emerald-500 text-white text-xs py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                          >
                            Aceptar
                          </button>
                          <button className="flex-1 bg-gray-100 text-gray-600 text-xs py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                            Ignorar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Friends List */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tus Amigos ({friends.length})</h3>
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3 p-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-gray-700">{friend.full_name || friend.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'add' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 p-4 rounded-2xl mb-4">
                  <h3 className="font-bold text-emerald-800 mb-1">Añadir Amigo</h3>
                  <p className="text-xs text-emerald-600 mb-4">Busca a otros usuarios por su correo electrónico.</p>
                  
                  <form onSubmit={handleSendRequest} className="space-y-3">
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white"
                      required
                    />
                    <button 
                      type="submit"
                      className="w-full bg-emerald-500 text-white py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Enviar Solicitud
                    </button>
                  </form>
                  
                  {searchStatus && (
                    <div className={`mt-3 text-xs p-2 rounded-lg ${
                      searchStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {searchStatus.message}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
