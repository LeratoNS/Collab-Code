// Lerato Sibanda u22705504 P14

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import type {
  User,
  Project,
  Activity,
  FriendRequest,
  Discussion,
  ProjectType,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
} from '../types';

// Auth API
export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, credentials),
  
  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.REGISTER, data),
  
  logout: () =>
    apiClient.post<ApiResponse<null>>(API_ENDPOINTS.LOGOUT),
  
  getCurrentUser: () =>
    apiClient.get<ApiResponse<User>>(API_ENDPOINTS.ME),
};

// User API
export const userApi = {
  getAllUsers: () =>
    apiClient.get<ApiResponse<User[]>>(API_ENDPOINTS.USERS),
  
  getUserById: (id: string) =>
    apiClient.get<ApiResponse<User>>(API_ENDPOINTS.USER_BY_ID(id)),
  
  updateProfile: (data: Partial<User>) =>
    apiClient.put<ApiResponse<User>>(API_ENDPOINTS.UPDATE_PROFILE, data),
  
  deleteAccount: () =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.DELETE_ACCOUNT),
  
  saveProject: (projectId: string) =>
    apiClient.post<ApiResponse<null>>(API_ENDPOINTS.SAVE_PROJECT, { projectId }),
  
  unsaveProject: (projectId: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.UNSAVE_PROJECT(projectId)),
  
  getSavedProjects: (userId: string) =>
    apiClient.get<ApiResponse<Project[]>>(API_ENDPOINTS.SAVED_PROJECTS(userId)),
};

// Friend API
export const friendApi = {
  getFriendRequests: () =>
    apiClient.get<ApiResponse<FriendRequest[]>>(API_ENDPOINTS.FRIEND_REQUESTS),
  
  sendFriendRequest: (receiverId: string) =>
    apiClient.post<ApiResponse<FriendRequest>>(API_ENDPOINTS.SEND_FRIEND_REQUEST, { receiverId }),
  
  acceptFriendRequest: (requestId: string) =>
    apiClient.post<ApiResponse<null>>(API_ENDPOINTS.ACCEPT_FRIEND_REQUEST(requestId)),
  
  rejectFriendRequest: (requestId: string) =>
    apiClient.post<ApiResponse<null>>(API_ENDPOINTS.REJECT_FRIEND_REQUEST(requestId)),
  
  unfriend: (userId: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.UNFRIEND(userId)),
};

// Project API
export const projectApi = {
  getAllProjects: () =>
    apiClient.get<ApiResponse<Project[]>>(API_ENDPOINTS.PROJECTS),
  
  getLocalProjects: () =>
    apiClient.get<ApiResponse<Project[]>>(API_ENDPOINTS.LOCAL_PROJECTS),
  
  getGlobalProjects: () =>
    apiClient.get<ApiResponse<Project[]>>(API_ENDPOINTS.GLOBAL_PROJECTS),
  
  getProjectById: (id: string) =>
    apiClient.get<ApiResponse<Project>>(API_ENDPOINTS.PROJECT_BY_ID(id)),
  
  createProject: (formData: FormData) =>
    apiClient.post<ApiResponse<Project>>(API_ENDPOINTS.CREATE_PROJECT, formData),
  
  updateProject: (id: string, formData: FormData) =>
    apiClient.put<ApiResponse<Project>>(API_ENDPOINTS.UPDATE_PROJECT(id), formData),
  
  deleteProject: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.DELETE_PROJECT(id)),
  
  checkoutProject: (id: string) =>
    apiClient.post<ApiResponse<Project>>(API_ENDPOINTS.CHECKOUT_PROJECT(id)),
  
  checkinProject: (id: string, data: { message: string; version: string; files: File[] }) =>
    apiClient.post<ApiResponse<Project>>(API_ENDPOINTS.CHECKIN_PROJECT(id), data),
  
  addMember: (projectId: string, userId: string) =>
    apiClient.post<ApiResponse<Project>>(API_ENDPOINTS.ADD_MEMBER(projectId), { userId }),
  
  removeMember: (projectId: string, userId: string) =>
    apiClient.delete<ApiResponse<Project>>(API_ENDPOINTS.REMOVE_MEMBER(projectId), {
      body: { userId },
    }),
  
  transferOwnership: (projectId: string, newOwnerId: string) =>
    apiClient.post<ApiResponse<Project>>(API_ENDPOINTS.TRANSFER_OWNERSHIP(projectId), { newOwnerId }),
};

// Activity API
export const activityApi = {
  getAllActivities: () =>
    apiClient.get<ApiResponse<Activity[]>>(API_ENDPOINTS.ACTIVITIES),
  
  getLocalActivities: () =>
    apiClient.get<ApiResponse<Activity[]>>(API_ENDPOINTS.LOCAL_ACTIVITIES),
  
  getGlobalActivities: () =>
    apiClient.get<ApiResponse<Activity[]>>(API_ENDPOINTS.GLOBAL_ACTIVITIES),
  
  getProjectActivities: (projectId: string) =>
    apiClient.get<ApiResponse<Activity[]>>(API_ENDPOINTS.PROJECT_ACTIVITIES(projectId)),
};

// Discussion API
export const discussionApi = {
  getDiscussions: (projectId: string) =>
    apiClient.get<ApiResponse<Discussion[]>>(API_ENDPOINTS.DISCUSSIONS(projectId)),
  
  addDiscussion: (projectId: string, message: string) =>
    apiClient.post<ApiResponse<Discussion>>(API_ENDPOINTS.ADD_DISCUSSION(projectId), { message }),
};

// Search API
export const searchApi = {
  searchUsers: (query: string) =>
    apiClient.get<ApiResponse<User[]>>(`${API_ENDPOINTS.SEARCH_USERS}?q=${encodeURIComponent(query)}`),
  
  searchProjects: (query: string) =>
    apiClient.get<ApiResponse<Project[]>>(`${API_ENDPOINTS.SEARCH_PROJECTS}?q=${encodeURIComponent(query)}`),
};

// Project Type API
export const projectTypeApi = {
  getProjectTypes: () =>
    apiClient.get<ApiResponse<ProjectType[]>>(API_ENDPOINTS.PROJECT_TYPES),
  
  addProjectType: (name: string) =>
    apiClient.post<ApiResponse<ProjectType>>(API_ENDPOINTS.ADD_PROJECT_TYPE, { name }),
};

// Admin API
export const adminApi = {
  // Users
  getAllUsers: () =>
    apiClient.get<ApiResponse<User[]>>(API_ENDPOINTS.ADMIN_USERS),
  updateUser: (id: string, data: Partial<User>) =>
    apiClient.put<ApiResponse<User>>(API_ENDPOINTS.ADMIN_UPDATE_USER(id), data),
  deleteUser: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.ADMIN_DELETE_USER(id)),
  
  // Projects
  getAllProjects: () =>
    apiClient.get<ApiResponse<Project[]>>(API_ENDPOINTS.ADMIN_PROJECTS),
  updateProject: (id: string, data: Partial<Project>) =>
    apiClient.put<ApiResponse<Project>>(API_ENDPOINTS.ADMIN_UPDATE_PROJECT(id), data),
  deleteProject: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.ADMIN_DELETE_PROJECT(id)),
  
  // Activities
  getAllActivities: () =>
    apiClient.get<ApiResponse<Activity[]>>(API_ENDPOINTS.ADMIN_ACTIVITIES),
  deleteActivity: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.ADMIN_DELETE_ACTIVITY(id)),
  
  // Project Types
  getAllProjectTypes: () =>
    apiClient.get<ApiResponse<ProjectType[]>>(API_ENDPOINTS.ADMIN_PROJECT_TYPES),
  addProjectType: (name: string) =>
    apiClient.post<ApiResponse<ProjectType>>(API_ENDPOINTS.ADMIN_ADD_PROJECT_TYPE, { name }),
  deleteProjectType: (id: string) =>
    apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.ADMIN_DELETE_PROJECT_TYPE(id)),
  
  // Verification Requests
  getVerificationRequests: () =>
    apiClient.get<ApiResponse<User[]>>(API_ENDPOINTS.ADMIN_VERIFICATION_REQUESTS),
  approveVerification: (id: string) =>
    apiClient.post<ApiResponse<User>>(API_ENDPOINTS.ADMIN_APPROVE_VERIFICATION(id), {}),
  denyVerification: (id: string) =>
    apiClient.post<ApiResponse<User>>(API_ENDPOINTS.ADMIN_DENY_VERIFICATION(id), {}),
};

// User verification
export const verificationApi = {
  requestVerification: () =>
    apiClient.post<ApiResponse<User>>(API_ENDPOINTS.REQUEST_VERIFICATION, {}),
};
