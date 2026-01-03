import { useState } from "react";
import {
  FiPlus,
  FiUser,
  FiLogOut,
  FiGlobe,
  FiMessageSquare,
} from "react-icons/fi";
import CreateRoomModal from "./CreateRoomModal";
import ProfileModal from "./ProfileModal";

interface Room {
  id: number;
  name: string;
  isGeneral: boolean;
}

interface RoomSidebarProps {
  rooms: Room[];
  currentRoomId: number | null;
  onRoomSelect: (roomId: number) => void;
  onLogout: () => void;
  username: string;
  color: string;
}

export default function RoomSidebar({
  rooms,
  currentRoomId,
  onRoomSelect,
  onLogout,
  username,
  color,
}: RoomSidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Add a friendly greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <>
      <div className="w-72 sidebar-card flex flex-col bg-white h-full">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-1">
          <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <FiMessageSquare className="text-2xl" aria-label="chat" />
            ChatApp
          </h2>
          <span className="text-xs text-gray-500">
            {getGreeting()}, <span className="font-semibold">{username}!</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg shadow hover:bg-blue-700 mb-3 transition"
              aria-label="Créer un nouveau salon"
            >
              <FiPlus className="text-lg" />
              <span>Créer un salon</span>
            </button>
          </div>
          <nav aria-label="Liste des salons" className="space-y-1 px-2">
            {rooms.length === 0 && (
              <div className="text-center text-gray-400 py-6 text-sm">
                Aucun salon trouvé.
              </div>
            )}
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomSelect(room.id)}
                className={`w-full text-left px-4 py-3 rounded-md hover:bg-blue-100/60 flex items-center gap-2 transition font-medium group ${
                  currentRoomId === room.id
                    ? "bg-blue-100 text-blue-600 border-l-4 border-blue-500 font-semibold shadow"
                    : "text-gray-700"
                }`}
                aria-current={currentRoomId === room.id ? "page" : undefined}
              >
                <span className="text-base">
                  {room.isGeneral ? (
                    <FiGlobe className="text-blue-400" aria-label="Général" />
                  ) : (
                    <FiMessageSquare
                      className="text-blue-300"
                      aria-label="Salon"
                    />
                  )}
                </span>
                <span className="text-sm truncate"># {room.name}</span>
                {currentRoomId === room.id && (
                  <span className="ml-auto rounded-full bg-blue-500 w-2.5 h-2.5" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-lg shadow"
              style={{
                background: color,
                border: "2px solid #fff",
              }}
              title="Votre avatar"
            >
              {username[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold truncate">{username}</div>
              <span className="text-xs text-gray-400">Connecté</span>
            </div>
          </div>
          {/* LARGE buttons in a column to prevent overlap */}
          <div className="flex flex-col gap-2 w-full mt-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full bg-gray-100 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 justify-center transition"
              aria-label="Voir le profil"
            >
              <FiUser className="text-gray-500" />
              <span className="">Profil</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 justify-center transition"
              aria-label="Se déconnecter"
            >
              <FiLogOut />
              <span className="">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}

      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          currentUsername={username}
          currentColor={color}
        />
      )}
    </>
  );
}
