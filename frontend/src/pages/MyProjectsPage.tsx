// Lerato Sibanda u22705504 P14

import * as React from 'react';
const { useState, useEffect } = React;
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../api';
import { Project } from '../types';
import { useAuthStore } from '../store/authStore';
import { ProjectCard } from '../components/ProjectCard';
import { Button } from '../components/Button';

export const MyProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'owned' | 'member'>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await projectApi.getAllProjects();
      if (response.success && response.data) {
        // Filter projects where user is owner or member
        const myProjects = response.data.filter(project => {
          const ownerId = typeof project.ownerId === 'object' 
            ? (project.ownerId as any)?._id 
            : project.ownerId;
          
          const isOwner = ownerId === user?._id;
          const isMember = project.members?.includes(user?._id || '');
          
          return isOwner || isMember;
        });
        setProjects(myProjects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const ownerId = typeof project.ownerId === 'object' 
      ? (project.ownerId as any)?._id 
      : project.ownerId;
    
    if (filter === 'owned') {
      return ownerId === user?._id;
    } else if (filter === 'member') {
      return ownerId !== user?._id && project.members?.includes(user?._id || '');
    }
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Projects</h1>
        <Button onClick={() => navigate('/create-project')}>
          Create New Project
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <span>All Projects</span>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {projects.length}
          </span>
        </button>
        <button
          onClick={() => setFilter('owned')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'owned'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <span>Owned by Me</span>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            {projects.filter(p => {
              const ownerId = typeof p.ownerId === 'object' ? (p.ownerId as any)?._id : p.ownerId;
              return ownerId === user?._id;
            }).length}
          </span>
        </button>
        <button
          onClick={() => setFilter('member')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'member'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <span>Member Only</span>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
            {projects.filter(p => {
              const ownerId = typeof p.ownerId === 'object' ? (p.ownerId as any)?._id : p.ownerId;
              return ownerId !== user?._id && p.members?.includes(user?._id || '');
            }).length}
          </span>
        </button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filter === 'all' && "You haven't joined any projects yet."}
            {filter === 'owned' && "You don't own any projects yet."}
            {filter === 'member' && "You're not a member of any projects yet."}
          </p>
          {filter === 'all' && (
            <div className="mt-6">
              <Button onClick={() => navigate('/create-project')}>
                Create Your First Project
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onClick={() => navigate(`/project/${project._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

