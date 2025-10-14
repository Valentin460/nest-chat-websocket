'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ProfileModal from './ProfileModal';

interface User {
  id: number;
  username: string;
  email: string;
  displayColor?: string;
}

interface Message {
  id: number;
  username: string;
  message: string;
  timestamp: string;
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

export default function Chat({ user: initialUser, onLogout }: ChatProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<User>(initialUser);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('newMessage', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('userJoined', (data: { username: string; message: string; timestamp: string }) => {
      const systemMessage: Message = {
        id: Date.now(),
        username: 'Système',
        message: data.message,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    newSocket.on('userLeft', (data: { username: string; message: string; timestamp: string }) => {
      const systemMessage: Message = {
        id: Date.now(),
        username: 'Système',
        message: data.message,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, systemMessage]);
    });

    newSocket.on('connectedUsers', (users: ConnectedUser[]) => {
      setConnectedUsers(users);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [onLogout, user.username]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('sendMessage', { message: newMessage.trim() });
      setNewMessage('');
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

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Chat WebSocket</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm">
                  {isConnected ? 'Connecté' : 'Déconnecté'} • {user.username}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-medium transition duration-300"
              >
                Profil
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition duration-300"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-96">
          <div className="w-1/4 bg-gray-50 border-r border-gray-200 p-4">
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

          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.username === user.username ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.username === 'Système'
                          ? 'bg-yellow-100 text-yellow-800 text-center italic'
                          : message.username === user.username
                          ? 'text-white'
                          : 'bg-white text-gray-800 border'
                      }`}
                      style={
                        message.username === user.username
                          ? { backgroundColor: user.displayColor || '#6B7280' }
                          : {}
                      }
                    >
                      {message.username !== 'Système' && message.username !== user.username && (
                        <div className="text-xs font-semibold text-gray-600 mb-1">
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
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
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
    </div>
  );
}
