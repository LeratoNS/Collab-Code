// Lerato Sibanda u22705504 P14
import * as React from 'react';
const { useState, useEffect } = React;
import { useParams, useNavigate } from 'react-router-dom';
import { userApi, projectApi, activityApi, friendApi, authApi } from '../api';
import { User, Project, Activity, FriendRequest } from '../types';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ProjectCard } from '../components/ProjectCard';
import { ActivityCard } from '../components/ActivityCard';
import { PromptDialog } from '../components/PromptDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'pending' | 'sent'>('none');
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'saved' | 'friends' | 'activity'>('projects');
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState<{
    isOpen: boolean;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    onConfirm: () => {},
  });
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
  const { showSuccess, showError, ToastContainer } = useToast();
  
  const isOwnProfile = !userId || userId === currentUser?._id;
  const isAdmin = currentUser?.isAdmin || false;
  
  useEffect(() => {
    loadProfile();
    
    // Check for edit query parameter (for admin)
    const params = new URLSearchParams(window.location.search);
    if (params.get('edit') === 'true' && isAdmin) {
      setIsEditing(true);
    }
  }, [userId]);
  
  // Add global drag listeners to close file dialogs
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      // Close all file input dialogs when dragging starts
      if (e.dataTransfer?.types.includes('Files')) {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input: any) => {
          if (document.activeElement === input) {
            input.blur();
          }
        });
      }
    };
    
    window.addEventListener('dragover', handleGlobalDragOver);
    
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
    };
  }, []);
  
  const loadProfile = async () => {
    setLoading(true);
    try {
      const targetUserId = userId || currentUser?._id;
      if (!targetUserId) return;
      
      const userResponse = await userApi.getUserById(targetUserId);
      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
        
        // Check if friend and friend request status (admin can view all profiles)
        if (currentUser && !isOwnProfile) {
          setIsFriend(currentUser.friends?.includes(targetUserId) || isAdmin);
          
          // Check friend request status
          try {
            const friendRequestsResponse = await friendApi.getFriendRequests();
            if (friendRequestsResponse.success && friendRequestsResponse.data) {
              const existingRequest = friendRequestsResponse.data.find(
                (req: FriendRequest) => {
                  // Handle both populated (object) and unpopulated (string) IDs
                  const senderId = typeof req.senderId === 'object' ? (req.senderId as any)?._id : req.senderId;
                  const receiverId = typeof req.receiverId === 'object' ? (req.receiverId as any)?._id : req.receiverId;
                  
                  return (
                    (senderId === currentUser._id && receiverId === targetUserId) ||
                    (receiverId === currentUser._id && senderId === targetUserId)
                  );
                }
              );
              
              if (existingRequest) {
                const senderId = typeof existingRequest.senderId === 'object' 
                  ? (existingRequest.senderId as any)?._id 
                  : existingRequest.senderId;
                
                if (senderId === currentUser._id) {
                  setFriendRequestStatus('sent');
                } else {
                  setFriendRequestStatus('pending');
                }
              } else {
                setFriendRequestStatus('none');
              }
            }
          } catch (error) {
            console.error('Failed to check friend request status:', error);
          }
        }
      } else {
        console.error('User not found or error loading user');
      }
      
      // Load user's projects
      const projectsResponse = await projectApi.getAllProjects();
      if (projectsResponse.success && projectsResponse.data) {
        const userProjects = projectsResponse.data.filter(
          p => {
            if (!p.ownerId) return false;
            const ownerId = typeof p.ownerId === 'object' ? (p.ownerId as any)?._id : p.ownerId;
            return ownerId === targetUserId || (p.members && p.members.includes(targetUserId || ''));
          }
        );
        setProjects(userProjects);
      }
      
      // Load user's activities
      const activitiesResponse = await activityApi.getAllActivities();
      if (activitiesResponse.success && activitiesResponse.data) {
        const userActivities = activitiesResponse.data.filter(
          a => {
            if (!a.userId) return false;
            const activityUserId = typeof a.userId === 'object' ? (a.userId as any)?._id : a.userId;
            return activityUserId === targetUserId;
          }
        );
        setActivities(userActivities);
      }
      
      // Load saved projects
      try {
        const savedResponse = await userApi.getSavedProjects(targetUserId);
        if (savedResponse.success && savedResponse.data) {
          setSavedProjects(savedResponse.data);
        }
      } catch (error) {
        console.error('Failed to load saved projects:', error);
      }
      
      // Load friends list
      if (userResponse.success && userResponse.data && userResponse.data.friends) {
        try {
          const friendPromises = userResponse.data.friends.map((friendId: string) => 
            userApi.getUserById(friendId)
          );
          const friendResponses = await Promise.all(friendPromises);
          const friendsData = friendResponses
            .filter(r => r.success && r.data)
            .map(r => r.data!);
          setFriendsList(friendsData);
        } catch (error) {
          console.error('Failed to load friends:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendFriendRequest = async () => {
    if (!user) return;
    try {
      const response = await friendApi.sendFriendRequest(user._id);
      if (response.success) {
        // Reload profile to update button state (no alert)
        await loadProfile();
      }
    } catch (error: any) {
      // Check if error is because request already exists
      if (error.message && error.message.includes('already exists')) {
        // Reload profile to show correct button state (no alert)
        await loadProfile();
      }
    }
  };
  
  const handleUnfriend = async () => {
    if (!user) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Unfriend User',
      message: `Are you sure you want to unfriend ${user.name}? You can always send them a friend request again later.`,
      variant: 'danger',
      onConfirm: async () => {
    try {
      await friendApi.unfriend(user._id);
      setIsFriend(false);
          showSuccess('Successfully unfriended user');
          
          // Reload the profile to update friend list and other friend-related data
          await loadProfile();
    } catch (error) {
      console.error('Failed to unfriend:', error);
          showError('Failed to unfriend user');
        }
    }
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">User not found</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-lg shadow-lg transition-all ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.type === 'success' ? '✓' : '✗'}</span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
            {user.profileImage ? (
              <img
                src={`${user.profileImage}`}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h1>
              {user.isVerified && (
                <span className="text-blue-500 dark:text-blue-400 text-2xl" title="Verified">
                  ✓
                </span>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">@{user.username}</p>
            
            {/* Show bio only if own profile or friends */}
            {(isOwnProfile || isFriend) && user.bio && (
              <p className="text-gray-700 dark:text-gray-300 mt-3">{user.bio}</p>
            )}
            
            {/* Show additional info only if own profile or friends */}
            {(isOwnProfile || isFriend) && (
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
              {user.work && <p>🏢 {user.work}</p>}
              {user.birthday && <p>🎂 {new Date(user.birthday).toLocaleDateString()}</p>}
              {user.relationship && <p>❤️ {user.relationship}</p>}
            </div>
            )}
            
            {/* Show limited info message for non-friends */}
            {!isOwnProfile && !isFriend && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 italic">
                🔒 Add as friend to view full profile
              </p>
            )}
            
            <div className="flex gap-3 mt-4">
              {(isOwnProfile || isAdmin) ? (
                <>
                <Button onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
                  {isOwnProfile && !user.isVerified && !user.verificationRequested && (
                    <Button 
                      variant="secondary" 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/users/request-verification', {
                            method: 'POST',
                            headers: {
                              'X-Session-ID': localStorage.getItem('sessionId') || '',
                            },
                            credentials: 'include',
                          });
                          
                          const data = await response.json();
                          
                          if (response.ok) {
                            setNotification({ message: data.message || 'Verification request submitted!', type: 'success' });
                            await loadProfile();
                          } else {
                            setNotification({ message: data.message || 'Failed to request verification', type: 'error' });
                          }
                          setTimeout(() => setNotification(null), 5000);
                        } catch (error) {
                          setNotification({ message: 'Failed to request verification', type: 'error' });
                          setTimeout(() => setNotification(null), 3000);
                        }
                      }}
                    >
                      Request Verification
                    </Button>
                  )}
                  {isOwnProfile && user.verificationRequested && !user.isVerified && (
                    <Button variant="secondary" disabled>
                      Verification Pending
                    </Button>
                  )}
                </>
              ) : !isAdmin && isFriend ? (
                <Button variant="secondary" onClick={handleUnfriend}>
                  Unfriend
                </Button>
              ) : friendRequestStatus === 'sent' ? (
                <Button variant="secondary" disabled>
                  Request Sent
                </Button>
              ) : friendRequestStatus === 'pending' ? (
                <Button onClick={async () => {
                  // Find the pending request and accept it
                  const friendRequestsResponse = await friendApi.getFriendRequests();
                  if (friendRequestsResponse.success && friendRequestsResponse.data) {
                    const request = friendRequestsResponse.data.find(
                      (req: FriendRequest) => req.receiverId === currentUser?._id && req.senderId === userId && req.status === 'pending'
                    );
                    if (request) {
                      await friendApi.acceptFriendRequest(request._id);
                      await loadProfile();
                    }
                  }
                }}>
                  Accept Friend Request
                </Button>
              ) : (
                <Button onClick={handleSendFriendRequest}>
                  Add Friend
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Profile Form */}
      {isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Edit Profile</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            
            try {
              let response;
              
              // Admin editing another user's profile
              if (isAdmin && !isOwnProfile) {
                response = await fetch(`/api/admin/users/${userId}`, {
                  method: 'PUT',
                  headers: {
                    'X-Session-ID': localStorage.getItem('sessionId') || '',
                  },
                  credentials: 'include',
                  body: formData,
                });
              } else {
                // User editing their own profile
                response = await fetch('/api/users/profile', {
                  method: 'PUT',
                  headers: {
                    'X-Session-ID': localStorage.getItem('sessionId') || '',
                  },
                  credentials: 'include',
                  body: formData,
                });
              }
              
              if (response.ok) {
                setIsEditing(false);
                setPreviewImage(null);
                // Update the auth store with new user data if editing own profile
                if (isOwnProfile) {
                  const updatedUserResponse = await authApi.getCurrentUser();
                  if (updatedUserResponse.success && updatedUserResponse.data) {
                    const { login } = useAuthStore.getState();
                    login(updatedUserResponse.data);
                  }
                }
                loadProfile();
                setNotification({ message: 'Profile updated successfully!', type: 'success' });
                setTimeout(() => setNotification(null), 3000);
              } else {
                setNotification({ message: 'Failed to update profile', type: 'error' });
                setTimeout(() => setNotification(null), 3000);
              }
            } catch (error) {
              setNotification({ message: 'Failed to update profile', type: 'error' });
              setTimeout(() => setNotification(null), 3000);
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
              
              {/* Drag and Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Only set dragging to false if we're leaving the drop zone itself
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX;
                  const y = e.clientY;
                  if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
                    setIsDragging(false);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const files = e.dataTransfer.files;
                  if (files.length > 0 && files[0].type.startsWith('image/')) {
                    const fileInput = document.querySelector('input[name="profileImage"]') as HTMLInputElement;
                    if (fileInput) {
                      // Close any open file dialog by resetting and setting the input
                      fileInput.value = '';
                      
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(files[0]);
                      fileInput.files = dataTransfer.files;
                      
                      // Trigger blur to close any open native file dialogs
                      fileInput.blur();
                      
                      // Create preview
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setPreviewImage(event.target?.result as string);
                        // Remove drag state after successful drop
                        setIsDragging(false);
                      };
                      reader.readAsDataURL(files[0]);
                    } else {
                      setIsDragging(false);
                    }
                  } else {
                    setIsDragging(false);
                  }
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : user.profileImage ? (
                      <img
                        src={`${user.profileImage}`}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {isDragging ? 'Drop image here' : 'Drag and drop your image here'}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">or</p>
                    <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Browse Files
                      <input
                        type="file"
                        name="profileImage"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setPreviewImage(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Supports: JPG, PNG, GIF, WebP
                  </p>
                  
                  {(previewImage || user.profileImage) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        const fileInput = document.querySelector('input[name="profileImage"]') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.value = '';
                        }
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                name="name"
                defaultValue={user.name}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input
                type="text"
                name="username"
                defaultValue={user.username}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
              <textarea
                name="bio"
                defaultValue={user.bio || ''}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Work</label>
              <input
                type="text"
                name="work"
                defaultValue={user.work || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birthday</label>
              <input
                type="date"
                name="birthday"
                defaultValue={user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship Status</label>
              <input
                type="text"
                name="relationship"
                defaultValue={user.relationship || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="secondary" onClick={() => {
                setIsEditing(false);
                setPreviewImage(null);
              }}>
                Cancel
              </Button>
            </div>
          </form>
          
          {/* Delete Account Section */}
          {isOwnProfile && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Deleting your account is permanent and cannot be undone. All your data, including projects you own, will be deleted.
              </p>
              <Button 
                variant="danger"
                onClick={() => {
                  setDeleteAccountDialog({
                    isOpen: true,
                    onConfirm: async (confirmation: string) => {
                      if (confirmation.toUpperCase() !== 'DELETE') {
                        showError('Account deletion cancelled. You must type "DELETE" exactly to confirm.');
                        return;
                      }
                      
                      try {
                        const response = await fetch('/api/users/account', {
                          method: 'DELETE',
                          headers: {
                            'X-Session-ID': localStorage.getItem('sessionId') || '',
                          },
                          credentials: 'include',
                        });
                        
                        if (response.ok) {
                          showSuccess('Your account has been deleted.');
                          // Clear session and redirect to splash page
                          localStorage.removeItem('sessionId');
                          const { logout } = useAuthStore.getState();
                          logout();
                          setTimeout(() => navigate('/'), 1000); // Give time to show success message
                        } else {
                          const errorData = await response.json();
                          showError(`Failed to delete account: ${errorData.message || 'Unknown error'}`);
                        }
                      } catch (error) {
                        console.error('Delete account error:', error);
                        showError('Failed to delete account');
                      }
                    }
                  });
                }}
              >
                Delete My Account
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Tabs Navigation - Only visible to friends, own profile, and admin */}
      {(isOwnProfile || isFriend || isAdmin) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="flex border-b dark:border-gray-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'projects'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>Projects</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {projects.length}
              </span>
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'saved'
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>★ Saved</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                  {savedProjects.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'friends'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>Friends</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                {friendsList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'activity'
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>Activity</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                {activities.length}
              </span>
            </button>
          </div>

        <div className="p-6">
          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div>
        {projects.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No projects yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
          )}

          {/* Saved Projects Tab */}
          {activeTab === 'saved' && (
            <div>
              {savedProjects.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No saved projects yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedProjects.map((project) => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div>
              {friendsList.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No friends yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendsList.map((friend) => (
                    <div
                      key={friend._id}
                      className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer border border-indigo-100 dark:border-indigo-800"
                      onClick={() => navigate(`/profile/${friend._id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                          {friend.profileImage ? (
                            <img
                              src={`${friend.profileImage}`}
                              alt={friend.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            friend.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {friend.name}
                            {friend.isVerified && <span className="text-blue-500 dark:text-blue-400">✓</span>}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">@{friend.username}</p>
                          {friend.bio && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{friend.bio}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
      <div>
        {activities.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No activity yet.</p>
        ) : (
          <div className="space-y-4">
                  {activities.slice(0, 10).map((activity) => {
                    // Extract project ID (handle both populated and unpopulated)
                    const projectId = (activity.projectId && typeof activity.projectId === 'object') 
                      ? (activity.projectId as any)?._id 
                      : activity.projectId;
                    
                    // Extract user data (handle both populated and unpopulated)
                    const activityUser = (activity.userId && typeof activity.userId === 'object')
                      ? activity.userId as any
                      : user; // Fallback to profile owner if not populated
                    
                    return (
              <ActivityCard
                key={activity._id}
                activity={activity}
                        user={activityUser}
                        project={projectId ? projects.find(p => p._id === projectId) : undefined}
              />
                    );
                  })}
                </div>
              )}
          </div>
        )}
      </div>
      </div>
      )}
      
      {/* Delete Account Prompt Dialog */}
      <PromptDialog
        isOpen={deleteAccountDialog.isOpen}
        onClose={() => setDeleteAccountDialog({ ...deleteAccountDialog, isOpen: false })}
        onConfirm={deleteAccountDialog.onConfirm}
        title="Delete Account"
        message='This action is irreversible. Type "DELETE" to confirm account deletion:'
        validation={(value) => value.toUpperCase() === 'DELETE'}
        validationMessage="You must type DELETE (case-insensitive) to confirm."
      />
      
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
