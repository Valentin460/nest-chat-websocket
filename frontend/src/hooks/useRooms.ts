import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";

interface Room {
  id: number;
  name: string;
  isGeneral: boolean;
  createdAt?: Date;
}

interface JoinGeneralResponse {
  roomId: number;
  messages: unknown[];
}

interface CreateRoomResponse {
  id: number;
  name: string;
  isGeneral: boolean;
  createdAt: Date;
}

export const useRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const socket = getSocket();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    // Connecter le socket si ce n'est pas déjà fait
    if (!socket.connected) {
      socket.connect();
    }

    // Rejoindre le salon général
    socket.emit(
      "joinGeneral",
      { userId: user.id },
      (response: JoinGeneralResponse) => {
        setCurrentRoomId(response.roomId);
        socket.emit("getRooms", { userId: user.id }, (roomsData: Room[]) => {
          setRooms(roomsData);
        });
      }
    );

    // Écouter les nouveaux salons
    const handleNewRoom = (room: Room) => {
      setRooms((prev) => {
        // Éviter les doublons
        if (prev.some((r) => r.id === room.id)) {
          return prev;
        }
        return [...prev, room];
      });
      toast.success(`Nouveau salon : ${room.name}`);
    };

    socket.on("newRoom", handleNewRoom);

    return () => {
      socket.off("newRoom", handleNewRoom);
    };
  }, [user, socket]);

  const createRoom = (
    name: string,
    memberIds: number[],
    giveHistoryAccess: boolean
  ): Promise<Room> => {
    return new Promise((resolve, reject) => {
      if (!user) {
        const error = "Utilisateur non connecté";
        toast.error(error);
        reject(new Error(error));
        return;
      }

      if (!socket.connected) {
        const error = "Socket non connecté";
        toast.error(error);
        reject(new Error(error));
        return;
      }

      socket.emit(
        "createRoom",
        {
          name,
          creatorId: user.id,
          memberIds,
          giveHistoryAccess,
        },
        (response: CreateRoomResponse | { error: string }) => {
          if ("error" in response) {
            toast.error(`Erreur : ${response.error}`);
            reject(new Error(response.error));
            return;
          }

          // Ajouter le salon immédiatement à la liste
          setRooms((prev) => {
            // Éviter les doublons
            if (prev.some((r) => r.id === response.id)) {
              return prev;
            }
            return [...prev, response];
          });

          toast.success(`Salon "${response.name}" créé avec succès !`);
          resolve(response);
        }
      );
    });
  };

  return { rooms, currentRoomId, setCurrentRoomId, createRoom };
};
