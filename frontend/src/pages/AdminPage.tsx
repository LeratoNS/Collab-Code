// Lerato Sibanda u22705504 P14

import * as React from 'react';
const { useState, useEffect } = React;
import { adminApi, verificationApi } from '../api';
import { User, Project, Activity, ProjectType } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'activities' | 'types' | 'verifications'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTypeName, setNewTypeName] = useState('');

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      alert('Access denied. Admin privileges required.');
      navigate('/home');
      return;
    }
    loadAllData();
  }, [currentUser, navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load all data at once for counts
      const [usersResponse, projectsResponse, activitiesResponse, typesResponse, verificationsResponse] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getAllProjects(),
        adminApi.getAllActivities(),
        adminApi.getAllProjectTypes(),
        adminApi.getVerificationRequests()
      ]);

      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data);
      }
      if (projectsResponse.success && projectsResponse.data) {
        setProjects(projectsResponse.data);
      }
      if (activitiesResponse.success && activitiesResponse.data) {
        setActivities(activitiesResponse.data);
      }
      if (typesResponse.success && typesResponse.data) {
        setProjectTypes(typesResponse.data);
      }
      if (verificationsResponse.success && verificationsResponse.data) {
        setVerificationRequests(verificationsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadData = loadAllData; // Alias for backward compatibility

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await adminApi.deleteUser(id);
      alert('User deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      await adminApi.deleteProject(id);
      alert('Project deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      await adminApi.deleteActivity(id);
      alert('Activity deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete activity:', error);
      alert('Failed to delete activity');
    }
  };

  const handleAddProjectType = async () => {
    if (!newTypeName.trim()) {
      alert('Please enter a type name');
      return;
    }
    try {
      await adminApi.addProjectType(newTypeName);
      alert('Project type added successfully');
      setNewTypeName('');
      loadData();
    } catch (error) {
      console.error('Failed to add project type:', error);
      alert('Failed to add project type');
    }
  };

  const handleDeleteProjectType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project type?')) return;
    try {
      await adminApi.deleteProjectType(id);
      alert('Project type deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete project type:', error);
      alert('Failed to delete project type');
    }
  };

  const handleApproveVerification = async (id: string) => {
    try {
      await adminApi.approveVerification(id);
      alert('Verification approved successfully');
      loadData();
    } catch (error) {
      console.error('Failed to approve verification:', error);
      alert('Failed to approve verification');
    }
  };

  const handleDenyVerification = async (id: string) => {
    try {
      await adminApi.denyVerification(id);
      alert('Verification denied successfully');
      loadData();
    } catch (error) {
      console.error('Failed to deny verification:', error);
      alert('Failed to deny verification');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        <button
          className={`py-2 px-4 text-lg font-medium flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('users')}
        >
          <span>Users</span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {users.length}
          </span>
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'projects'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('projects')}
        >
          <span>Projects</span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            {projects.length}
          </span>
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'activities'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('activities')}
        >
          <span>Activities</span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
            {activities.length}
          </span>
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'types'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('types')}
        >
          <span>Project Types</span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
            {projectTypes.length}
          </span>
        </button>
        <button
          className={`py-2 px-4 text-lg font-medium flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'verifications'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
          }`}
          onClick={() => setActiveTab('verifications')}
        >
          <span>Verifications</span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
            {verificationRequests.length}
          </span>
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No users found.</p>
          ) : (
            users.map(user => (
              <Card key={user._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">@{user.username} • {user.email}</p>
                    <div className="flex gap-2 mt-2">
                      {user.isAdmin && (
                        <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">Admin</span>
                      )}
                      {user.isVerified && (
                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">Verified</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/profile/${user._id}`)}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/profile/${user._id}?edit=true`)}
                    >
                      Edit
                    </Button>
                    {currentUser?._id !== user._id && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No projects found.</p>
          ) : (
            projects.map(project => (
              <Card key={project._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{project.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Type: {project.type} • Version: {project.version} • Status: {project.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        console.log('Navigating to project:', project._id, 'Full project:', project);
                        navigate(`/project/${project._id}`);
                      }}
                    >
                      View Project
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/project/${project._id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDeleteProject(project._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No activities found.</p>
          ) : (
            activities.map(activity => (
              <Card key={activity._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">
                        {typeof activity.userId === 'object' ? (activity.userId as any).name : 'Unknown User'}
                      </span>
                      {' '}
                      {activity.type === 'check-in' && 'checked in'}
                      {activity.type === 'check-out' && 'checked out'}
                      {activity.type === 'create-project' && 'created'}
                      {activity.type === 'add-member' && 'added a member to'}
                      {' '}
                      <span className="font-semibold">
                        {typeof activity.projectId === 'object' ? (activity.projectId as any).name : 'Unknown Project'}
                      </span>
                    </p>
                    {activity.message && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Message: {activity.message}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDeleteActivity(activity._id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'types' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Project Type</h3>
            <div className="flex gap-2">
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Enter project type name"
                className="flex-1"
              />
              <Button onClick={handleAddProjectType}>Add Type</Button>
            </div>
          </Card>

          {projectTypes.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No project types found.</p>
          ) : (
            projectTypes.map(type => (
              <Card key={type._id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{type.name}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDeleteProjectType(type._id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'verifications' && (
        <div className="space-y-4">
          {verificationRequests.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No verification requests found.</p>
          ) : (
            verificationRequests.map(user => (
              <Card key={user._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">@{user.username} • {user.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Account created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/profile/${user._id}`)}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveVerification(user._id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDenyVerification(user._id)}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

