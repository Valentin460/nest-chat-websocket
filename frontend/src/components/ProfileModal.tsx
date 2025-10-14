'use client';

import { useState } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  displayColor?: string;
}

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdate: (user: User) => void;
}

const PRESET_COLORS = [
  { name: 'Gris', value: '#6B7280' },
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Vert', value: '#10B981' },
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
];

export default function ProfileModal({ user, isOpen, onClose, onUserUpdate }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    username: user.username,
    displayColor: user.displayColor || '#6B7280',
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleColorSelect = (color: string) => {
    setFormData({
      ...formData,
      displayColor: color,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.put(
        'http://localhost:3001/users/profile',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        setMessage({ text: response.data.message, type: 'success' });
        const updatedUser = { ...user, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onUserUpdate(updatedUser);
        
        setTimeout(() => {
          onClose();
          setMessage({ text: '', type: '' });
        }, 1500);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la modification du profil';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Modifier mon profil</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {message.text && (
          <div
            className={`px-4 py-3 rounded-lg mb-4 text-center font-medium ${
              message.type === 'success'
                ? 'bg-green-100 border border-green-300 text-green-800'
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              minLength={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-500 focus:outline-none transition duration-300 text-gray-700"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-3">
              Couleur d'affichage
            </label>
            
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: formData.displayColor }}
              ></div>
              <span className="text-sm text-gray-600">
                Aperçu de votre couleur : {formData.displayColor}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleColorSelect(color.value)}
                  className={`w-12 h-12 rounded-lg border-2 transition duration-300 ${
                    formData.displayColor === color.value
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>

            <div>
              <label htmlFor="displayColor" className="block text-sm text-gray-600 mb-1">
                Ou choisissez une couleur personnalisée :
              </label>
              <input
                type="color"
                id="displayColor"
                name="displayColor"
                value={formData.displayColor}
                onChange={handleInputChange}
                className="w-full h-12 border-2 border-gray-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
