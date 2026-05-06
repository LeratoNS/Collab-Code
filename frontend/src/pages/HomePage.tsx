// Lerato Sibanda u22705504 P14
import * as React from 'react';
const { useState, useEffect } = React;
import { activityApi, userApi, projectApi } from '../api';
import { Activity, User, Project } from '../types';
import { ActivityCard } from '../components/ActivityCard';
import { ProjectCard } from '../components/ProjectCard';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';

export const HomePage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.isAdmin || false;
  
  const [activityFeedType, setActivityFeedType] = useState<'local' | 'global'>(isAdmin ? 'global' : 'local');
  const [projectFeedType, setProjectFeedType] = useState<'local' | 'global'>(isAdmin ? 'global' : 'local');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'popularity'>('date');
  
  useEffect(() => {
    loadActivities();
  }, [activityFeedType]);
  
  useEffect(() => {
    loadProjects();
  }, [projectFeedType]);
  
  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      console.log('Loading projects - projectFeedType:', projectFeedType);
      const response = projectFeedType === 'local'
        ? await projectApi.getLocalProjects()
        : await projectApi.getGlobalProjects();
      console.log('Projects response:', response);
      if (response.success && response.data) {
        console.log('Setting projects:', response.data.length, 'projects');
        setAllProjects(response.data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };
  
  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = activityFeedType === 'local'
        ? await activityApi.getLocalActivities()
        : await activityApi.getGlobalActivities();
      
      if (response.success && response.data) {
        setActivities(response.data);
        
        // Extract users and projects from populated data
        const usersMap: Record<string, User> = {};
        const projectsMap: Record<string, Project> = {};
        
        response.data.forEach(activity => {
          // Handle populated userId (could be object or string)
          if (activity.userId) {
            if (typeof activity.userId === 'object') {
              const user = activity.userId as any;
              if (user && user._id) {
                usersMap[user._id] = user;
              }
            }
          }
          
          // Handle populated projectId (could be object or string)
          if (activity.projectId) {
            if (typeof activity.projectId === 'object') {
              const project = activity.projectId as any;
              if (project && project._id) {
                projectsMap[project._id] = project;
              }
            }
          }
        });
        
        setUsers(usersMap);
        setProjects(projectsMap);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const sortedActivities = [...activities].sort((a, b) => {
    if (sortBy === 'date') {
      // Reverse chronological order (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'popularity') {
      // Sort by project popularity (number of files, members, etc.)
      const projectIdA = (a.projectId && typeof a.projectId === 'object') 
        ? (a.projectId as any)?._id 
        : a.projectId;
      const projectIdB = (b.projectId && typeof b.projectId === 'object') 
        ? (b.projectId as any)?._id 
        : b.projectId;
      
      const projectA = projectIdA ? projects[projectIdA] : null;
      const projectB = projectIdB ? projects[projectIdB] : null;
      
      // Calculate popularity score (files + members + activities)
      const scoreA = (projectA?.files?.length || 0) + (projectA?.members?.length || 0);
      const scoreB = (projectB?.files?.length || 0) + (projectB?.members?.length || 0);
      
      return scoreB - scoreA;
    }
    return 0;
  });
  
  // Get popular/trending projects (most files and members)
  // For global feed, show all projects; for local feed, show top 6
  const sortedProjects = [...allProjects]
    .sort((a, b) => {
      const scoreA = (a.files?.length || 0) * 2 + (a.members?.length || 0);
      const scoreB = (b.files?.length || 0) * 2 + (b.members?.length || 0);
      return scoreB - scoreA;
    });
  
  const trendingProjects = projectFeedType === 'global' 
    ? sortedProjects // Show all projects for global
    : sortedProjects.slice(0, 6); // Top 6 projects for local
  
  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2"></h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400"></p>
      </div>

      {/* Projects Section with Local/Global Toggle */}
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isAdmin ? 'All Projects' : projectFeedType === 'local' ? 'Friends\' Projects' : 'All Projects'}
          </h2>
          
          {/* Hide toggle for admin users */}
          {!isAdmin && (
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setProjectFeedType('local')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  projectFeedType === 'local'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                👥 Friends
              </button>
              <button
                onClick={() => setProjectFeedType('global')}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  projectFeedType === 'global'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                🌍 Global
              </button>
            </div>
          )}
        </div>
        
        {projectsLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading projects...</p>
          </div>
        ) : trendingProjects.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-lg">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
              {projectFeedType === 'local' ? 'No friend projects yet' : 'No projects yet'}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {projectFeedType === 'local' 
                ? 'Your friends haven\'t created any projects yet!' 
                : 'Be the first to create a project!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
              {trendingProjects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
            
            {/* Show project count for global feed */}
            {projectFeedType === 'global' && trendingProjects.length > 0 && (
              <div className="text-center mt-6 pt-4 border-t">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Showing {trendingProjects.length} {trendingProjects.length === 1 ? 'project' : 'projects'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Activity Feed Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {isAdmin ? '🌍 All Activities' : activityFeedType === 'local' ? '👥 Friends Activity' : '🌍 Global Activity'}
          </h2>
          
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Hide toggle for admin users */}
            {!isAdmin && (
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActivityFeedType('local')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    activityFeedType === 'local'
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  👥 Friends
                </button>
                <button
                  onClick={() => setActivityFeedType('global')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    activityFeedType === 'global'
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  🌍 Global
                </button>
              </div>
            )}
            
            <div className="flex gap-2 items-center">
              <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'popularity')}
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="date">📅 Latest First</option>
                <option value="popularity">⭐ Most Popular</option>
              </select>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading activities...</p>
          </div>
        ) : sortedActivities.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-lg">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-700 dark:text-gray-200 text-lg font-medium mb-2">
              {activityFeedType === 'local' ? 'No friend activity yet' : 'No activity yet'}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {activityFeedType === 'local' 
                ? 'Add friends to see their activity here!' 
                : 'Be the first to create a project or check out code!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedActivities.map((activity) => {
              // Get userId and projectId (handle both populated and unpopulated)
              const userId = (activity.userId && typeof activity.userId === 'object') 
                ? (activity.userId as any)?._id 
                : activity.userId;
              const projectId = (activity.projectId && typeof activity.projectId === 'object') 
                ? (activity.projectId as any)?._id 
                : activity.projectId;
              
              return (
                <ActivityCard
                  key={activity._id}
                  activity={activity}
                  user={userId ? users[userId] : undefined}
                  project={projectId ? projects[projectId] : undefined}
                />
              );
            })}
            
            {/* Load More Hint */}
            {sortedActivities.length >= 20 && (
              <div className="text-center py-6 border-t dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Showing {sortedActivities.length} activities
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
