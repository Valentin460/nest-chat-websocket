import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRooms } from "@/hooks/useRooms";

interface User {
  id: number;
  username: string;
  color: string;
}

interface CreateRoomModalProps {
  onClose: () => void;
}

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const { createRoom } = useRooms();
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [giveHistoryAccess, setGiveHistoryAccess] = useState(true);
  const currentUser = useAuthStore((state) => state.user);

  const { data: usersResponse } = useQuery({
    queryKey: ["users"],
    queryFn: () => userApi.getAll(),
  });

  const users: User[] =
    usersResponse?.data?.filter((u: User) => u.id !== currentUser?.id) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    try {
      await createRoom(name, selectedUsers, giveHistoryAccess);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la création du salon:", error);
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 modal-card">
        <h2 className="text-xl font-bold mb-4">Créer un salon</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nom du salon"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <div>
            <label className="block mb-2 font-semibold">
              Inviter des utilisateurs
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {users.map((user: User) => (
                <label
                  key={user.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                  />
                  <span>{user.username}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={giveHistoryAccess}
              onChange={(e) => setGiveHistoryAccess(e.target.checked)}
            />
            <span>Donner accès à l&lsquo;historique</span>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
