// Lerato Sibanda u22705504 P14

// User Types
export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  profileImage?: string;
  bio?: string;
  birthday?: string;
  work?: string;
  contactInfo?: string;
  relationship?: string;
  isAdmin: boolean;
  isVerified?: boolean;
  verificationRequested?: boolean;
  createdAt: Date;
  friends: string[]; // Array of user IDs
  savedProjects?: string[]; // Array of project IDs
}

// Project Types
export interface Project {
  _id: string;
  name: string;
  description: string;
  image?: string;
  ownerId: string;
  members: string[]; // Array of user IDs
  hashtags: string[]; // Programming languages
  type: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'checked-in' | 'checked-out';
  checkedOutBy?: string; // User ID
  files: ProjectFile[];
}

export interface ProjectFile {
  _id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string; // User ID
}

// Activity Types
export interface Activity {
  _id: string;
  type: 'check-in' | 'check-out' | 'create-project' | 'add-member';
  userId: string;
  projectId: string;
  message?: string;
  versionNumber?: string;
  createdAt: Date;
}

// Friend Request Types
export interface FriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

// Discussion Types
export interface Discussion {
  _id: string;
  projectId: string;
  userId: string;
  message: string;
  createdAt: Date;
}

// Project Type (category)
export interface ProjectType {
  _id: string;
  name: string;
  createdAt: Date;
}

// Frontend-only types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
