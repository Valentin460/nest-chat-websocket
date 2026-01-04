'use client';

import { useState, useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import ChatWithRooms from '@/components/ChatWithRooms';

interface User {
  id: number;
  username: string;
  email: string;
  displayColor?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  if (user) {
    return <ChatWithRooms user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-light text-center text-gray-800 mb-8">Chat WebSocket</h1>
        <AuthForm onSuccess={setUser} />
      </div>
    </div>
  );
}
