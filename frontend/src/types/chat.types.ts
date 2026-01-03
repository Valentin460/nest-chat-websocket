export type RoomMember = {
  id: string;
  username: string;
  displayColor: string;
  canAccessHistory?: boolean;
  joinedAt?: string;
};

export type RoomSummary = {
  id: string;
  name: string;
  isGeneral: boolean;
  members: RoomMember[];
  membership?: {
    canAccessHistory: boolean;
    joinedAt: string;
  };
};

export type Message = {
  id: string;
  roomId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayColor: string;
  };
  reactions: {
    id: string;
    emoji: string;
    user: {
      id: string;
      username: string;
      displayColor: string;
    };
  }[];
};

export type PublicUser = {
  id: string;
  email: string;
  username: string;
  displayColor: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthState = {
  accessToken: string;
  user: PublicUser;
};
