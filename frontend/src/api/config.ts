// Lerato Sibanda u22705504 P14

export const API_BASE_URL = (typeof process !== 'undefined' && process.env.API_URL) || '/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  UPDATE_PROFILE: '/users/profile',
  DELETE_ACCOUNT: '/users/account',
  SAVE_PROJECT: '/users/save-project',
  UNSAVE_PROJECT: (projectId: string) => `/users/unsave-project/${projectId}`,
  SAVED_PROJECTS: (userId: string) => `/users/${userId}/saved-projects`,
  
  // Friends
  FRIEND_REQUESTS: '/friends/requests',
  SEND_FRIEND_REQUEST: '/friends/send',
  ACCEPT_FRIEND_REQUEST: (id: string) => `/friends/accept/${id}`,
  REJECT_FRIEND_REQUEST: (id: string) => `/friends/reject/${id}`,
  UNFRIEND: (id: string) => `/friends/unfriend/${id}`,
  
  // Projects
  PROJECTS: '/projects',
  LOCAL_PROJECTS: '/projects/local',
  GLOBAL_PROJECTS: '/projects/global',
  PROJECT_BY_ID: (id: string) => `/projects/${id}`,
  CREATE_PROJECT: '/projects/create',
  UPDATE_PROJECT: (id: string) => `/projects/${id}/update`,
  DELETE_PROJECT: (id: string) => `/projects/${id}/delete`,
  CHECKOUT_PROJECT: (id: string) => `/projects/${id}/checkout`,
  CHECKIN_PROJECT: (id: string) => `/projects/${id}/checkin`,
  ADD_MEMBER: (id: string) => `/projects/${id}/members`,
  REMOVE_MEMBER: (id: string) => `/projects/${id}/members`,
  TRANSFER_OWNERSHIP: (id: string) => `/projects/${id}/transfer-ownership`,
  
  // Activity
  ACTIVITIES: '/activities',
  LOCAL_ACTIVITIES: '/activities/local',
  GLOBAL_ACTIVITIES: '/activities/global',
  PROJECT_ACTIVITIES: (id: string) => `/activities/project/${id}`,
  
  // Discussion
  DISCUSSIONS: (projectId: string) => `/discussions/${projectId}`,
  ADD_DISCUSSION: (projectId: string) => `/discussions/${projectId}/add`,
  
  // Search
  SEARCH_USERS: '/search/users',
  SEARCH_PROJECTS: '/search/projects',
  
  // Project Types
  PROJECT_TYPES: '/project-types',
  ADD_PROJECT_TYPE: '/project-types/add',
  
  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_UPDATE_USER: (id: string) => `/admin/users/${id}`,
  ADMIN_DELETE_USER: (id: string) => `/admin/users/${id}`,
  ADMIN_PROJECTS: '/admin/projects',
  ADMIN_UPDATE_PROJECT: (id: string) => `/admin/projects/${id}`,
  ADMIN_DELETE_PROJECT: (id: string) => `/admin/projects/${id}`,
  ADMIN_ACTIVITIES: '/admin/activities',
  ADMIN_DELETE_ACTIVITY: (id: string) => `/admin/activities/${id}`,
  ADMIN_PROJECT_TYPES: '/admin/project-types',
  ADMIN_ADD_PROJECT_TYPE: '/admin/project-types',
  ADMIN_DELETE_PROJECT_TYPE: (id: string) => `/admin/project-types/${id}`,
  ADMIN_VERIFICATION_REQUESTS: '/admin/verification-requests',
  ADMIN_APPROVE_VERIFICATION: (id: string) => `/admin/verification-requests/${id}/approve`,
  ADMIN_DENY_VERIFICATION: (id: string) => `/admin/verification-requests/${id}/deny`,
  REQUEST_VERIFICATION: '/users/request-verification',
};
