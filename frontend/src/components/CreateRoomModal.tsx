'use client';

import { useState, useEffect } from 'react';
import { FaTimes, FaUsers } from 'react-icons/fa';

interface User {
  id: number;
  username: string;
  email: string;
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: () => void;
  connectedUsers: User[];
  currentUserId: number;
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onRoomCreated,
  connectedUsers,
  currentUserId,
}: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [grantHistoryAccess, setGrantHistoryAccess] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableUsers = connectedUsers.filter(u => u.id !== currentUserId);

  useEffect(() => {
    if (!isOpen) {
      setRoomName('');
      setSelectedUsers([]);
      setGrantHistoryAccess(true);
      setError('');
    }
  }, [isOpen]);

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!roomName.trim()) {
      setError('Veuillez entrer un nom de salon');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: roomName.trim(),
          memberIds: selectedUsers,
          grantHistoryAccess,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la création du salon');
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      onRoomCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaUsers className="text-gray-600" />
            Créer un salon
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="roomName" className="block text-gray-700 font-medium mb-2">
              Nom du salon
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none text-gray-800"
              placeholder="Ex: Équipe Marketing"
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Sélectionner les membres ({selectedUsers.length} sélectionné{selectedUsers.length > 1 ? 's' : ''})
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
              {availableUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucun autre utilisateur connecté
                </div>
              ) : (
                availableUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                      disabled={isLoading}
                    />
                    <span className="ml-3 text-gray-700">{user.username}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={grantHistoryAccess}
                onChange={(e) => setGrantHistoryAccess(e.target.checked)}
                className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                disabled={isLoading}
              />
              <span className="ml-3 text-gray-700">
                Accorder l'accès à l'historique des messages
              </span>
            </label>
            <p className="ml-7 mt-1 text-sm text-gray-500">
              Si désactivé, les nouveaux membres ne verront que les messages postés après leur arrivée
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || availableUsers.length === 0}
            >
              {isLoading ? 'Création...' : 'Créer le salon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
