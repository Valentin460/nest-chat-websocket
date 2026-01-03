import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

interface ProfileModalProps {
  onClose: () => void;
  currentUsername: string;
  currentColor: string;
}

export default function ProfileModal({
  onClose,
  currentUsername,
  currentColor,
}: ProfileModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [color, setColor] = useState(currentColor);
  const { user, setUser } = useAuthStore();

  const updateMutation = useMutation({
    mutationFn: () => userApi.updateProfile(user!.id, username, color),
    onSuccess: (response) => {
      setUser(response.data);
      toast.success("Profil mis à jour!");
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const colors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 modal-card">
        <h2 className="text-xl font-bold mb-4">Modifier le profil</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div>
            <label className="block mb-2 font-semibold">Couleur</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full ${
                    color === c ? "ring-4 ring-gray-400" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

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
              disabled={updateMutation.isPending}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
