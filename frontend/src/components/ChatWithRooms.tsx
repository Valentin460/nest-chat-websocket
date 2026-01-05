'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ProfileModal from './ProfileModal';
import CreateRoomModal from './CreateRoomModal';
import { FaThumbsUp, FaHeart, FaLaughSquint, FaFire, FaPlus, FaComments, FaDoorOpen, FaUsers } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';

interface User {
  id: number;
  username: string;
  email: string;
  displayColor?: string;
}

interface Room {
  id: number;
  name: string;
  creatorId: number;
  memberIds: number[];
  memberPermissions: Record<number, { hasHistoryAccess: boolean; joinedAt: string }>;
}

interface Message {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  reactions?: Record<string, string[]>;
  displayColor?: string | null;
}

interface ConnectedUser {
  id: number;
  username: string;
  email: string;
}

interface ChatProps {
  user: User;
  onLogout: () => void;
}

export default function ChatWithRooms({ user: initialUser, onLogout }: ChatProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<User>(initialUser);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [generalChatMessages, setGeneralChatMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Chargement des salons...');
      const response = await fetch('http://localhost:3001/rooms', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Données reçues:', data);
      console.log('Salons:', data.rooms);
      setRooms(data.rooms || []);
      console.log('State rooms mis à jour');
    } catch (error) {
      console.error('Erreur lors du chargement des salons:', error);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      onLogout();
      return;
    }

    const newSocket = io('http://localhost:3001', {
      auth: {
        token: token,
      },
    });

    newSocket.on('connect', () => {
      console.log('Connecté au serveur de chat');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Déconnecté du serveur de chat');
      setIsConnected(false);
    });

    newSocket.on('chatHistory', (history: Message[]) => {
      console.log('Historique du chat général reçu:', history.length, 'messages');
      setGeneralChatMessages(history);
      if (!currentRoom) {
        setMessages(history);
      }
    });

    newSocket.on('newMessage', (message: Message) => {
      if (!currentRoom) {
        setMessages((prev) => [...prev, message]);
        setGeneralChatMessages((prev) => [...prev, message]);
      }
    });

    newSocket.on('newRoomMessage', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('roomJoined', (data: { room: Room; messages: Message[] }) => {
      setCurrentRoom(data.room);
      const normalizedMessages = data.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString(),
      }));
      setMessages(normalizedMessages);
    });

    newSocket.on('userJoined', (data: { username: string; message: string; timestamp: string }) => {
      if (!currentRoom) {
        const systemMessage: Message = {
          id: Date.now(),
          username: 'Système',
          message: data.message,
          timestamp: data.timestamp,
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    });

    newSocket.on('userLeft', (data: { username: string; message: string; timestamp: string }) => {
      if (!currentRoom) {
        const systemMessage: Message = {
          id: Date.now(),
          username: 'Système',
          message: data.message,
          timestamp: data.timestamp,
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    });

    newSocket.on('connectedUsers', (users: ConnectedUser[]) => {
      setConnectedUsers(users);
    });

    newSocket.on('typingUsers', (usernames: string[]) => {
      const filteredTypingUsers = usernames.filter(username => username !== user.username);
      setTypingUsers(filteredTypingUsers);
    });

    newSocket.on('reactionAdded', (data: { messageId: number; reactions: Record<string, string[]> }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    });

    newSocket.on('reactionRemoved', (data: { messageId: number; reactions: Record<string, string[]> }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    });

    newSocket.on('userColorChanged', (data: { userId: number; username: string; displayColor: string }) => {
      console.log('🎨 Couleur changée pour', data.username, ':', data.displayColor);
      
      setGeneralChatMessages((prev) =>
        prev.map((msg) =>
          msg.username === data.username ? { ...msg, displayColor: data.displayColor } : msg
        )
      );
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.username === data.username ? { ...msg, displayColor: data.displayColor } : msg
        )
      );
      
      if (data.userId === user.id) {
        setUser((prevUser) => ({ ...prevUser, displayColor: data.displayColor }));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [onLogout, user.username]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      if (currentRoom) {
        socket.emit('sendRoomMessage', { roomId: currentRoom.id, message: newMessage.trim() });
      } else {
        socket.emit('sendMessage', { message: newMessage.trim() });
      }
      socket.emit('stopTyping');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setNewMessage('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!socket) return;

    if (value.trim() && !typingTimeoutRef.current) {
      socket.emit('startTyping', { roomId: currentRoom?.id || null });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { roomId: currentRoom?.id || null });
        typingTimeoutRef.current = null;
      }, 2000);
    } else {
      socket.emit('stopTyping', { roomId: currentRoom?.id || null });
      typingTimeoutRef.current = null;
    }
  };

  const handleLogout = () => {
    if (socket) {
      socket.close();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  const joinRoom = (room: Room) => {
    console.log('Tentative de rejoindre le salon:', room.name, 'ID:', room.id);
    console.log('Socket connecté?', !!socket, 'isConnected:', isConnected);
    if (socket) {
      console.log('Émission de joinRoom vers le serveur...');
      socket.emit('joinRoom', { roomId: room.id });
      setIsSidebarOpen(false);
    } else {
      console.error('Pas de socket disponible');
    }
  };

  const leaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit('leaveRoom', { roomId: currentRoom.id });
      setCurrentRoom(null);
      setMessages(generalChatMessages);
      setIsSidebarOpen(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypingIndicatorText = () => {
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} est en train d'écrire...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} et ${typingUsers[1]} sont en train d'écrire...`;
    } else {
      return `${typingUsers.length} personnes sont en train d'écrire...`;
    }
  };

  const handleAddReaction = (messageId: number, emoji: string) => {
    if (!socket) return;
    socket.emit('addReaction', { messageId, emoji });
  };

  const handleRemoveReaction = (messageId: number, emoji: string) => {
    if (!socket) return;
    socket.emit('removeReaction', { messageId, emoji });
  };

  const toggleReaction = (message: Message, emoji: string) => {
    const reactions = message.reactions || {};
    const users = reactions[emoji] || [];
    
    if (users.includes(user.username)) {
      handleRemoveReaction(message.id, emoji);
    } else {
      handleAddReaction(message.id, emoji);
    }
  };

  const handleRoomCreated = async () => {
    console.log('Salon créé, rechargement de la liste...');
    await loadRooms();
    console.log('Liste rechargée');
  };

  const reactionIcons: Record<string, { icon: React.ReactElement; label: string }> = {
    'thumbsup': { icon: <FaThumbsUp className="w-4 h-4" />, label: 'J\'aime' },
    'heart': { icon: <FaHeart className="w-4 h-4" />, label: 'Cœur' },
    'laugh': { icon: <FaLaughSquint className="w-4 h-4" />, label: 'Rire' },
    'party': { icon: <HiSparkles className="w-4 h-4" />, label: 'Fête' },
    'fire': { icon: <FaFire className="w-4 h-4" />, label: 'Feu' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700">
      <div className="h-screen bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden text-white p-2 hover:bg-gray-700 rounded-lg transition"
                aria-label="Toggle menu"
                title="Ouvrir/Fermer le menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  {currentRoom ? (
                    <>
                      <FaDoorOpen />
                      <span className="truncate max-w-[150px] md:max-w-none">{currentRoom.name}</span>
                    </>
                  ) : (
                    <>
                      <FaComments />
                      <span>Chat Général</span>
                    </>
                  )}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-xs md:text-sm">
                    {isConnected ? 'Connecté' : 'Déconnecté'} • {user.username}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 md:gap-2">
              {currentRoom && (
                <button
                  onClick={leaveRoom}
                  className="bg-orange-500 hover:bg-orange-600 px-2 md:px-4 py-2 rounded-lg font-medium transition duration-300 flex items-center gap-2"
                  title="Quitter le salon"
                >
                  <FaDoorOpen />
                  <span className="hidden sm:inline">Quitter le salon</span>
                </button>
              )}
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 px-2 md:px-4 py-2 rounded-lg font-medium transition duration-300"
                title="Profil"
              >
                <span className="hidden sm:inline">Profil</span>
                <span className="sm:hidden">Profil</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-2 md:px-4 py-2 rounded-lg font-medium transition duration-300"
                title="Se déconnecter"
              >
                <span className="hidden sm:inline">Se déconnecter</span>
                <span className="sm:hidden">Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex relative" style={{ height: 'calc(100vh - 88px)' }}>
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          <div className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:relative
            fixed lg:static inset-y-0 left-0 z-50
            w-64 lg:w-1/4 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto
            transition-transform duration-300 ease-in-out
          `}
          style={{ top: '88px', height: 'calc(100vh - 88px)' }}>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FaUsers />
                  Mes salons ({rooms.length})
                </h3>
                <button
                  onClick={() => setIsCreateRoomModalOpen(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition"
                  title="Créer un salon"
                >
                  <FaPlus />
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (currentRoom) leaveRoom();
                  }}
                  className={`w-full text-left p-2 rounded-lg transition ${
                    !currentRoom
                      ? 'bg-gray-600 text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FaComments />
                    <span className="font-medium">Chat Général</span>
                  </div>
                </button>
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => joinRoom(room)}
                    className={`w-full text-left p-2 rounded-lg transition ${
                      currentRoom?.id === room.id
                        ? 'bg-gray-600 text-white'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaDoorOpen />
                      <div>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-xs opacity-75">
                          {room.memberIds.length} membre{room.memberIds.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {!currentRoom && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Utilisateurs connectés ({connectedUsers.length})
                </h3>
                <div className="space-y-2">
                  {connectedUsers.map((connectedUser) => (
                    <div
                      key={connectedUser.id}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border"
                    >
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {connectedUser.username}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      message.username === user.username ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.username === 'Système'
                          ? 'bg-yellow-100 text-yellow-800 text-center italic'
                          : 'text-white'
                      }`}
                      style={
                        message.username !== 'Système'
                          ? { 
                              backgroundColor: message.username === user.username 
                                ? (user.displayColor || '#6B7280')
                                : (message.displayColor || '#6B7280')
                            }
                          : {}
                      }
                    >
                      {message.username !== 'Système' && message.username !== user.username && (
                        <div className="text-xs font-semibold text-white opacity-90 mb-1">
                          {message.username}
                        </div>
                      )}
                      <div className="text-sm">{message.message}</div>
                      <div
                        className={`text-xs mt-1 ${
                          message.username === 'Système'
                            ? 'text-yellow-600'
                            : message.username === user.username
                            ? 'text-gray-200'
                            : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                    
                    {message.username !== 'Système' && (
                      <div className="flex items-center gap-1 mt-1">
                        {message.reactions && Object.entries(message.reactions).map(([reactionKey, users]) => (
                          users.length > 0 && (
                            <button
                              key={reactionKey}
                              onClick={() => toggleReaction(message, reactionKey)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
                                users.includes(user.username)
                                  ? 'bg-blue-100 border-2 border-blue-400 text-blue-600'
                                  : 'bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-600'
                              }`}
                              title={users.join(', ')}
                            >
                              <span>{reactionIcons[reactionKey]?.icon || reactionKey}</span>
                              <span className="text-gray-600 font-medium">{users.length}</span>
                            </button>
                          )
                        ))}
                        
                        {Object.entries(reactionIcons).map(([key, { icon, label }]) => {
                          const count = message.reactions?.[key]?.length || 0;
                          if (count > 0) return null;
                          
                          return (
                            <button
                              key={key}
                              onClick={() => toggleReaction(message, key)}
                              className="px-2 py-1 rounded-full hover:bg-gray-200 transition opacity-50 hover:opacity-100 text-gray-500"
                              title={label}
                            >
                              {icon}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {typingUsers.length > 0 && (
              <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
                <div className="text-sm text-gray-600 italic flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span>{getTypingIndicatorText()}</span>
                </div>
              </div>
            )}

            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Tapez votre message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none text-black placeholder-black"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !isConnected}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
                >
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <ProfileModal
        user={user}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUserUpdate={setUser}
      />

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onRoomCreated={handleRoomCreated}
        connectedUsers={connectedUsers}
        currentUserId={user.id}
      />
    </div>
  );
}
