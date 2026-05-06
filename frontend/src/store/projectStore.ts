// Lerato Sibanda u22705504 P14

import { create } from 'zustand';
import { Project, Activity } from '../types';

interface ProjectState {
  projects: Project[];
  activities: Activity[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activities: [],
  currentProject: null,
  
  setProjects: (projects) => set({ projects }),
  
  addProject: (project) => set((state) => ({
    projects: [project, ...state.projects]
  })),
  
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p._id === id ? { ...p, ...updates } : p)
  })),
  
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p._id !== id)
  })),
  
  setCurrentProject: (project) => set({ currentProject: project }),
  
  setActivities: (activities) => set({ activities }),
  
  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities]
  })),
}));
