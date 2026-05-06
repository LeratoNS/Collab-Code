// Lerato Sibanda u22705504 P14

import { create } from 'zustand';
import { User, FriendRequest } from '../types';

interface UserState {
  users: User[];
  friendRequests: FriendRequest[];
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  setFriendRequests: (requests: FriendRequest[]) => void;
  addFriendRequest: (request: FriendRequest) => void;
  updateFriendRequest: (id: string, status: 'accepted' | 'rejected') => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  friendRequests: [],
  
  setUsers: (users) => set({ users }),
  
  addUser: (user) => set((state) => ({
    users: [...state.users, user]
  })),
  
  updateUser: (id, updates) => set((state) => ({
    users: state.users.map(u => u._id === id ? { ...u, ...updates } : u)
  })),
  
  deleteUser: (id) => set((state) => ({
    users: state.users.filter(u => u._id !== id)
  })),
  
  setFriendRequests: (requests) => set({ friendRequests: requests }),
  
  addFriendRequest: (request) => set((state) => ({
    friendRequests: [...state.friendRequests, request]
  })),
  
  updateFriendRequest: (id, status) => set((state) => ({
    friendRequests: state.friendRequests.map(r => 
      r._id === id ? { ...r, status } : r
    )
  })),
}));
