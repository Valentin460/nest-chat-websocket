'use client';

import { useState } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthFormProps {
  onSuccess: (user: User) => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = 'http://localhost:3000';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const clearMessage = () => {
    setMessage({ text: '', type: '' });
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessage();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { username: formData.username, email: formData.email, password: formData.password };

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);

      if (response.data) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        showMessage(response.data.message, 'success');
        onSuccess(response.data.user);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur de réseau. Vérifiez que le serveur est démarré.';
      showMessage(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const switchForm = () => {
    setIsLogin(!isLogin);
    clearMessage();
    setFormData({ username: '', email: '', password: '' });
  };

  return (
    <div>
      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg mb-6 text-center font-medium ${
            message.type === 'success'
              ? 'bg-green-100 border border-green-300 text-green-800'
              : 'bg-red-100 border border-red-300 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <h2 className="text-2xl font-normal text-center text-gray-600 mb-8">
        {isLogin ? 'Connexion' : 'Inscription'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isLogin && (
          <div>
            <label htmlFor="username" className="block text-gray-600 font-medium mb-2">
              Nom d'utilisateur:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required={!isLogin}
              minLength={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition duration-300 text-gray-700"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-gray-600 font-medium mb-2">
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition duration-300 text-gray-700"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-gray-600 font-medium mb-2">
            Mot de passe:
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition duration-300 text-gray-700"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading 
            ? (isLogin ? 'Connexion...' : 'Inscription...') 
            : (isLogin ? 'Se connecter' : "S'inscrire")
          }
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
        <button
          onClick={switchForm}
          className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition duration-300"
        >
          {isLogin ? "S'inscrire" : "Se connecter"}
        </button>
      </p>
    </div>
  );
}
