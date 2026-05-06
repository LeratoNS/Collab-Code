// Lerato Sibanda u22705504 P14

import * as React from 'react';
const { useState, useEffect } = React;
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi, projectTypeApi, userApi } from '../api';
import { Project, ProjectType, User } from '../types';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const EditProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { showSuccess, showError, ToastContainer } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  useEffect(() => {
    loadProjectData();
  }, [projectId]);
  
  const loadProjectData = async () => {
    if (!projectId) return;
    
    try {
      // Load project types FIRST before setting form data
      const typesResponse = await projectTypeApi.getProjectTypes();
      console.log('Project types response:', typesResponse);
      if (typesResponse.success && typesResponse.data) {
        console.log('Setting project types:', typesResponse.data);
        setProjectTypes(typesResponse.data);
      } else {
        console.error('Failed to load project types:', typesResponse);
      }
      
      // Load project
      const projectResponse = await projectApi.getProjectById(projectId);
      if (projectResponse.success && projectResponse.data) {
        const proj = projectResponse.data;
        setProject(proj);
        setFormData({
          name: proj.name,
          description: proj.description,
          type: proj.type,
        });
        if (proj.image) {
          setImagePreview(`${proj.image}`);
        }
        
        // Load members - handle both populated and unpopulated members array
        if (proj.members && proj.members.length > 0) {
          // Check if members are already populated (objects) or just IDs (strings)
          const firstMember = proj.members[0];
          if (typeof firstMember === 'object' && firstMember !== null && '_id' in firstMember) {
            // Members are already populated
            setMembers(proj.members as User[]);
          } else {
            // Members are just IDs, need to fetch
            const memberUsers = await Promise.all(
              proj.members.map(async (memberId: string) => {
                const res = await userApi.getUserById(memberId);
                return res.success && res.data ? res.data : null;
              })
            );
            setMembers(memberUsers.filter(Boolean) as User[]);
          }
        } else {
          setMembers([]);
        }
      }
      
      // Load current user's friends
      if (currentUser) {
        const userResponse = await userApi.getUserById(currentUser._id);
        if (userResponse.success && userResponse.data && userResponse.data.friends) {
          const friendUsers = await Promise.all(
            userResponse.data.friends.map(async (friendId: string) => {
              const res = await userApi.getUserById(friendId);
              return res.success && res.data ? res.data : null;
            })
          );
          setFriends(friendUsers.filter(Boolean) as User[]);
        }
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      // Admin uses admin API, regular users use regular API
      const endpoint = isAdmin && !isOwner
        ? `/api/admin/projects/${projectId}`
        : `/api/projects/${projectId}/update`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'X-Session-ID': localStorage.getItem('sessionId') || '',
        },
        credentials: 'include',
        body: formDataToSend,
      });
      
      if (response.ok) {
        showSuccess('Project updated successfully!');
        navigate(`/project/${projectId}`);
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        showError(`Failed to update project: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      showError(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAddMember = async () => {
    if (!projectId || !selectedFriendId) return;
    
    try {
      const response = await projectApi.addMember(projectId, selectedFriendId);
      if (response.success) {
        showSuccess('Member added successfully!');
        setSelectedFriendId('');
        loadProjectData();
      }
    } catch (error) {
      showError('Failed to add member');
    }
  };
  
  const handleRemoveMember = async (memberId: string) => {
    if (!projectId) return;
    
    // Find the member to get their name for the confirmation message
    const memberToRemove = members.find(m => m._id === memberId);
    const memberName = memberToRemove ? memberToRemove.name : 'this member';
    
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Member',
      message: `Are you sure you want to remove ${memberName} from this project?`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await projectApi.removeMember(projectId, memberId);
          if (response.success) {
            showSuccess('Member removed successfully!');
            loadProjectData();
          }
        } catch (error) {
          showError('Failed to remove member');
        }
      }
    });
  };
  
  const handleTransferOwnership = async () => {
    if (!projectId || !newOwnerId) return;
    
    // Find the new owner to get their name for the confirmation message
    const newOwner = members.find(m => m._id === newOwnerId);
    const newOwnerName = newOwner ? newOwner.name : 'the selected member';
    
    setConfirmDialog({
      isOpen: true,
      title: 'Transfer Ownership',
      message: `Are you sure you want to transfer ownership to ${newOwnerName}? You will no longer be the owner.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/projects/${projectId}/transfer-ownership`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-ID': localStorage.getItem('sessionId') || '',
            },
            credentials: 'include',
            body: JSON.stringify({ newOwnerId }),
          });
          
          if (response.ok) {
            showSuccess('Ownership transferred successfully!');
            navigate(`/project/${projectId}`);
          } else {
            showError('Failed to transfer ownership');
          }
        } catch (error) {
          showError('Failed to transfer ownership');
        }
      }
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }
  
  // Handle both populated and unpopulated ownerId
  const ownerId = project.ownerId && typeof project.ownerId === 'object' 
    ? (project.ownerId as any)._id 
    : project.ownerId;
  
  const isOwner = ownerId === currentUser?._id;
  const isAdmin = currentUser?.isAdmin || false;
  
  // Allow owner or admin to edit
  if (!isOwner && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Only the project owner or admin can edit this project</p>
      </div>
    );
  }
  
  const availableFriends = friends.filter(
    friend => !project.members.includes(friend._id)
  );
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Project</h1>
      
      {/* Basic Details */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Project Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Project Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>
          
          <div>
            <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 mb-1">
              Project Type {projectTypes.length === 0 && <span className="text-red-500">(Loading...)</span>}
            </label>
            <select
              id="type-select"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">
                {projectTypes.length === 0 ? 'Loading project types...' : 'Select a type'}
              </option>
              {projectTypes.map((type) => (
                <option key={type._id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Current value: "{formData.type}" | Available types: {projectTypes.length}
              {projectTypes.length > 0 && ` (${projectTypes.map(t => t.name).join(', ')})`}
            </p>
          </div>
          
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              Project Icon
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="max-h-48 mb-2 rounded" />
            )}
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-3">
            <Button type="submit">Save Changes</Button>
            <Button type="button" variant="secondary" onClick={() => navigate(`/project/${projectId}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Manage Members */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Manage Members</h2>
        
        {/* Add Member */}
        {availableFriends.length > 0 && (
          <div className="mb-6">
            <label htmlFor="add-member" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Add Friend to Project
            </label>
            <div className="flex gap-2">
              <select
                id="add-member"
                value={selectedFriendId}
                onChange={(e) => setSelectedFriendId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a friend</option>
                {availableFriends.map((friend) => (
                  <option key={friend._id} value={friend._id}>
                    {friend.name} (@{friend.username})
                  </option>
                ))}
              </select>
              <Button onClick={handleAddMember} disabled={!selectedFriendId}>
                Add Member
              </Button>
            </div>
          </div>
        )}
        
        {/* Current Members */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Current Members</h3>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              {members.length}
            </span>
          </div>
          <div className="space-y-2">
            {members.length > 0 ? (
              members.map((member) => {
                // Extract owner ID (handle both populated and unpopulated)
                const projectOwnerId = project.ownerId && typeof project.ownerId === 'object' 
                  ? (project.ownerId as any)._id 
                  : project.ownerId;
                
                return (
                  <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@{member.username}</p>
                    </div>
                    {member._id !== projectOwnerId && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveMember(member._id)}
                      >
                        Remove
                      </Button>
                    )}
                    {member._id === projectOwnerId && (
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Owner</span>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No members yet.</p>
            )}
          </div>
        </div>
      </Card>
      
      {/* Transfer Ownership */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Transfer Ownership</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Transfer ownership to another project member. You will become a regular member.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="new-owner" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Owner
            </label>
            <select
              id="new-owner"
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a member</option>
              {members.filter(m => m._id !== currentUser?._id).map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} (@{member.username})
                </option>
              ))}
            </select>
            {members.filter(m => m._id !== currentUser?._id).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No other members available to transfer ownership to.
              </p>
            )}
          </div>
          
          <Button
            variant="danger"
            onClick={handleTransferOwnership}
            disabled={!newOwnerId}
          >
            Transfer Ownership
          </Button>
        </div>
      </Card>
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

