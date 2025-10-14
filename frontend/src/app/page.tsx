'use client';

import { useState, useEffect } from 'react';
import AuthForm from '@/components/AuthForm';

interface User {
  id: number;
  username: string;
  email: string;
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

  // Check if user is logged in on mount
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-light text-center text-gray-800 mb-8">Chat WebSocket</h1>
          
          <div className="text-center">
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-6">
              Vous êtes déjà connecté !
            </div>
            
            <h2 className="text-2xl font-normal text-green-600 mb-4">Bienvenue !</h2>
            
            <div className="space-y-2 mb-6 text-gray-600">
              <p>
                Vous êtes connecté en tant que: <span className="font-semibold text-gray-800">{user.username}</span>
              </p>
              <p>
                Email: <span className="font-semibold text-gray-800">{user.email}</span>
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg uppercase tracking-wider"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-light text-center text-gray-800 mb-8">Chat WebSocket</h1>
        <AuthForm onSuccess={setUser} />
      </div>
    </div>
  );
}
