import { ApiClient } from './client';
import { User, Project, Activity, ProjectType } from '../types';

const adminClient = new ApiClient('/admin');

export const adminApi = {
  // Users
  getAllUsers: () => adminClient.get<User[]>('/users'),
  updateUser: (id: string, data: Partial<User>) => adminClient.put<User>(`/users/${id}`, data),
  deleteUser: (id: string) => adminClient.delete(`/users/${id}`),
  
  // Projects
  getAllProjects: () => adminClient.get<Project[]>('/projects'),
  updateProject: (id: string, data: Partial<Project>) => adminClient.put<Project>(`/projects/${id}`, data),
  deleteProject: (id: string) => adminClient.delete(`/projects/${id}`),
  
  // Activities
  getAllActivities: () => adminClient.get<Activity[]>('/activities'),
  deleteActivity: (id: string) => adminClient.delete(`/activities/${id}`),
  
  // Project Types
  getAllProjectTypes: () => adminClient.get<ProjectType[]>('/project-types'),
  addProjectType: (name: string) => adminClient.post<ProjectType>('/project-types', { name }),
  deleteProjectType: (id: string) => adminClient.delete(`/project-types/${id}`),
  
  // Verification Requests
  getVerificationRequests: () => adminClient.get<User[]>('/verification-requests'),
  approveVerification: (id: string) => adminClient.post<User>(`/verification-requests/${id}/approve`, {}),
  denyVerification: (id: string) => adminClient.post<User>(`/verification-requests/${id}/deny`, {}),
};

