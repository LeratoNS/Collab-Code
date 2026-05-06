// Lerato Sibanda u22705504 P14
import * as React from 'react';
const { useState, useEffect } = React;
import { useParams, useNavigate } from 'react-router-dom';
import { projectApi, activityApi, discussionApi, userApi } from '../api';
import { Project, Activity, Discussion, User } from '../types';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PromptDialog } from '../components/PromptDialog';
import { useToast } from '../hooks/useToast';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState('');
  const [checkinVersion, setCheckinVersion] = useState('');
  const [checkinFiles, setCheckinFiles] = useState<File[]>([]);
  const [discussionMessage, setDiscussionMessage] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showTransferOwnershipModal, setShowTransferOwnershipModal] = useState(false);
  const [showTransferConfirmModal, setShowTransferConfirmModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [showFileViewModal, setShowFileViewModal] = useState(false);
  const [viewingFile, setViewingFile] = useState<any>(null);
  
  // Toast and dialog states
  const { showSuccess, showError, showInfo, ToastContainer } = useToast();
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
  const [promptDialog, setPromptDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (value: string) => void;
    defaultValue?: string;
    validation?: (value: string) => boolean;
    validationMessage?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  // Handle both populated and unpopulated ownerId
  const ownerId = project?.ownerId && typeof project.ownerId === 'object' 
    ? (project.ownerId as any)._id 
    : project?.ownerId;
  
  // Check membership properly (handle ObjectId comparison)
  const isMember = project?.members.some((memberId: string) => {
    // Handle if memberId is an object
    const id = typeof memberId === 'object' ? (memberId as any)._id : memberId;
    return id === currentUser?._id;
  }) || ownerId === currentUser?._id;
  
  const isOwner = ownerId === currentUser?._id;
  const canCheckout = isMember && project?.status === 'checked-in';
  
  // Check if current user has checked out the project
  const checkedOutById = project?.checkedOutBy && typeof project.checkedOutBy === 'object'
    ? (project.checkedOutBy as any)._id
    : project?.checkedOutBy;
  const canCheckin = checkedOutById === currentUser?._id;
  
  // Check if project is locked by someone else
  const isLockedByOther = project?.status === 'checked-out' && checkedOutById !== currentUser?._id;
  const canModifyFiles = isMember && !isLockedByOther;
  
  useEffect(() => {
    loadProject();
    loadFriends();
    checkIfSaved();
  }, [projectId]);
  
  const checkIfSaved = async () => {
    if (!currentUser?._id || !projectId) return;
    try {
      const response = await userApi.getSavedProjects(currentUser._id);
      if (response.success && response.data) {
        setIsSaved(response.data.some((p: Project) => p._id === projectId));
      }
    } catch (error) {
      console.error('Failed to check if project is saved:', error);
    }
  };
  
  const loadFriends = async () => {
    try {
      const response = await userApi.getUserById(currentUser?._id || '');
      if (response.success && response.data && response.data.friends) {
        // Load friend details
        const friendPromises = response.data.friends.map(friendId => 
          userApi.getUserById(friendId)
        );
        const friendResponses = await Promise.all(friendPromises);
        const friendsData = friendResponses
          .filter(r => r.success && r.data)
          .map(r => r.data!);
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };
  
  const loadProject = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const projectResponse = await projectApi.getProjectById(projectId);
      if (projectResponse.success && projectResponse.data) {
        setProject(projectResponse.data);
        
        // Load owner (handle both populated and unpopulated ownerId)
        const ownerData = projectResponse.data.ownerId;
        if (typeof ownerData === 'object' && ownerData !== null) {
          // Owner is already populated
          setOwner(ownerData as User);
        } else if (typeof ownerData === 'string') {
          // Owner needs to be fetched
          const ownerResponse = await userApi.getUserById(ownerData);
          if (ownerResponse.success && ownerResponse.data) {
            setOwner(ownerResponse.data);
          }
        }
        
        // Load member details
        const memberPromises = projectResponse.data.members.map(memberId => {
          const id = typeof memberId === 'object' ? (memberId as any)._id : memberId;
          return userApi.getUserById(id);
        });
        const memberResponses = await Promise.all(memberPromises);
        const membersData = memberResponses
          .filter(r => r.success && r.data)
          .map(r => r.data!);
        setMembers(membersData);
        
        setCheckinVersion(projectResponse.data.version);
      }
      
      const activitiesResponse = await activityApi.getProjectActivities(projectId);
      if (activitiesResponse.success && activitiesResponse.data) {
        setActivities(activitiesResponse.data);
      }
      
      const discussionsResponse = await discussionApi.getDiscussions(projectId);
      if (discussionsResponse.success && discussionsResponse.data) {
        setDiscussions(discussionsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckout = async () => {
    if (!projectId) return;
    try {
      await projectApi.checkoutProject(projectId);
      showSuccess('Project checked out successfully!');
      loadProject();
    } catch (error) {
      showError('Failed to checkout project');
    }
  };
  
  const handleCheckin = async () => {
    if (!projectId) return;
    try {
      const formData = new FormData();
      formData.append('message', checkinMessage);
      formData.append('version', checkinVersion);
      
      checkinFiles.forEach((file) => {
        formData.append('files', file);
      });
      
      const response = await fetch(`/api/projects/${projectId}/checkin`, {
        method: 'POST',
        headers: {
          'X-Session-ID': localStorage.getItem('sessionId') || '',
        },
        credentials: 'include',
        body: formData,
      });
      
      if (response.ok) {
        showSuccess('Project checked in successfully!');
        setShowCheckinModal(false);
        setCheckinMessage('');
        setCheckinFiles([]);
        loadProject();
      } else {
        showError('Failed to checkin project');
      }
    } catch (error) {
      showError('Failed to checkin project');
    }
  };
  
  const handleDelete = async () => {
    if (!projectId) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await projectApi.deleteProject(projectId);
          showSuccess('Project deleted successfully');
          navigate('/home');
        } catch (error) {
          showError('Failed to delete project');
        }
      }
    });
  };
  
  const handleSaveProject = async () => {
    if (!projectId) return;
    try {
      if (isSaved) {
        await userApi.unsaveProject(projectId);
        setIsSaved(false);
        showSuccess('Project removed from saved projects');
      } else {
        await userApi.saveProject(projectId);
        setIsSaved(true);
        showSuccess('Project saved successfully!');
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to save project');
    }
  };
  
  const handleAddDiscussion = async () => {
    if (!projectId || !discussionMessage.trim()) return;
    try {
      await discussionApi.addDiscussion(projectId, discussionMessage);
      setDiscussionMessage('');
      showSuccess('Discussion added successfully');
      loadProject();
    } catch (error) {
      showError('Failed to add discussion');
    }
  };
  
  const handleAddMember = async (userId: string) => {
    if (!projectId) return;
    try {
      await projectApi.addMember(projectId, userId);
      setShowAddMemberModal(false);
      showSuccess('Member added successfully!');
      loadProject();
    } catch (error: any) {
      showError(error?.message || 'Failed to add member');
    }
  };
  
  const handleRemoveMember = async (userId: string) => {
    if (!projectId) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Member',
      message: 'Are you sure you want to remove this member from the project?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await projectApi.removeMember(projectId, userId);
          showSuccess('Member removed successfully!');
          loadProject();
        } catch (error) {
          showError('Failed to remove member');
        }
      }
    });
  };
  
  const handleTransferOwnership = async () => {
    if (!projectId || !selectedNewOwner) return;
    try {
      await projectApi.transferOwnership(projectId, selectedNewOwner._id);
      setShowTransferOwnershipModal(false);
      setShowTransferConfirmModal(false);
      setSelectedNewOwner(null);
      showSuccess('Ownership transferred successfully!');
      loadProject();
    } catch (error) {
      console.error('Transfer ownership error:', error);
      showError('Failed to transfer ownership');
    }
  };
  
  const handleSelectNewOwner = (member: User) => {
    setSelectedNewOwner(member);
    setShowTransferOwnershipModal(false);
    setShowTransferConfirmModal(true);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading project...</p>
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
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Project Header */}
      <Card className="p-6 mb-6">
        <div className="flex gap-6">
          {project.image && (
            <img
              src={`${project.image}`}
              alt={project.name}
              className="w-64 h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                modal.onclick = () => modal.remove();
                modal.innerHTML = `<img src="${project.image}" class="max-w-full max-h-full rounded-lg" alt="${project.name}" />`;
                document.body.appendChild(modal);
              }}
              title="Click to enlarge"
            />
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{project.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm px-3 py-1 rounded-full cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                      title={`Search for projects with #${tag}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Type: <span className="font-medium text-gray-900 dark:text-gray-100">{project.type}</span></p>
                  <p>Version: <span className="font-medium text-gray-900 dark:text-gray-100">{project.version}</span></p>
                  <p>Owner: <span className="font-medium text-gray-900 dark:text-gray-100">{owner?.name}</span></p>
                  <p>Members: <span className="font-medium text-gray-900 dark:text-gray-100">{project.members.length}</span></p>
                  <p>Status: <span className={`font-medium ${project.status === 'checked-in' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{project.status}</span></p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {/* Save/Unsave button for non-owners */}
                {!isOwner && (
                  <Button 
                    variant="secondary" 
                    onClick={handleSaveProject}
                    className="flex items-center gap-2"
                  >
                    {isSaved ? (
                      <>
                        <span>★</span> Saved
                      </>
                    ) : (
                      <>
                        <span>☆</span> Save Project
                      </>
                    )}
                  </Button>
                )}
                {canCheckout && (
                  <Button onClick={handleCheckout}>
                    Check Out
                  </Button>
                )}
                {canCheckin && (
                  <Button onClick={() => setShowCheckinModal(true)}>
                    Check In
                  </Button>
                )}
                {isOwner && (
                  <>
                    <Button variant="secondary" onClick={() => navigate(`/project/${projectId}/edit`)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Project Files */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Project Files</h2>
            {project.status === 'checked-out' && project.checkedOutBy && (
              <div className="mt-1">
                <p className="text-sm text-orange-600">
                  🔒 Project checked out by {
                    typeof project.checkedOutBy === 'object' 
                      ? (project.checkedOutBy as any).name 
                      : (project.checkedOutBy === currentUser?._id ? 'you' : 'another member')
                  }
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ℹ️ Files can be viewed and downloaded by anyone
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {isMember && (
              <>
                <Button
                  size="sm"
                  disabled={!canModifyFiles}
                  onClick={() => {
                    if (!canModifyFiles) {
                      showError('Project is checked out by another member. Cannot add files.');
                      return;
                    }
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = async (e: any) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      
                      const formData = new FormData();
                      for (let i = 0; i < files.length; i++) {
                        formData.append('files', files[i]);
                      }
                      
                      try {
                        const response = await fetch(`/api/projects/${projectId}/files/add`, {
                          method: 'POST',
                          headers: {
                            'X-Session-ID': localStorage.getItem('sessionId') || '',
                          },
                          credentials: 'include',
                          body: formData,
                        });
                        
                        if (response.ok) {
                          showSuccess('Files added successfully!');
                          loadProject();
                        } else {
                          const errorData = await response.json();
                          showError(errorData.message || 'Failed to add files');
                        }
                      } catch (error) {
                        showError('Failed to add files');
                      }
                    };
                    input.click();
                  }}
                >
                  Add Files
                </Button>
              </>
            )}
          </div>
        </div>
        {project.files && project.files.length > 0 ? (
          <Card className="p-4">
            <div className="space-y-2">
              {project.files.map((file: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB • Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* View button - ANYONE can view */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          if (!file._id) {
                            showError('Cannot view file: missing file ID');
                            return;
                          }
                          
                          const response = await fetch(`/api/projects/${projectId}/files/${file._id}/view`, {
                            headers: {
                              'X-Session-ID': localStorage.getItem('sessionId') || '',
                            },
                            credentials: 'include',
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.data) {
                              setViewingFile(data.data);
                              setShowFileViewModal(true);
                            }
                          } else {
                            const errorData = await response.json();
                            showError(errorData.message || 'Failed to view file');
                          }
                        } catch (error) {
                          console.error('View file error:', error);
                          showError('Failed to view file');
                        }
                      }}
                    >
                      View
                    </Button>
                    
                    {/* Download button - ANYONE can download */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                      try {
                        console.log('Downloading file:', file);
                        
                        if (!file._id) {
                          console.error('File has no _id:', file);
                          showError('Cannot download file: missing file ID');
                          return;
                        }
                        
                        const response = await fetch(`/api/projects/${projectId}/files/${file._id}/download`, {
                          headers: {
                            'X-Session-ID': localStorage.getItem('sessionId') || '',
                          },
                          credentials: 'include',
                        });
                        
                        console.log('Download response status:', response.status);
                        
                        if (response.ok) {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = file.name;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          showSuccess('File downloaded successfully!');
                        } else {
                          const errorText = await response.text();
                          console.error('Download error:', errorText);
                          try {
                            const errorJson = JSON.parse(errorText);
                            showError(errorJson.message || `Failed to download file: ${response.status}`);
                          } catch {
                            showError(`Failed to download file: ${response.status}`);
                          }
                        }
                      } catch (error) {
                        console.error('Download exception:', error);
                        showError(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }}
                  >
                    Download
                  </Button>
                  
                  {/* File management buttons (members or admin, disabled if locked by another unless admin) */}
                  {(isMember || currentUser?.isAdmin) && file._id && (
                    <>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!canModifyFiles && !currentUser?.isAdmin}
                        onClick={() => {
                          // Admin can delete even if locked
                          if (!canModifyFiles && !currentUser?.isAdmin) {
                            showError('Project is checked out by another member. Cannot delete files.');
                            return;
                          }
                          
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Delete File',
                            message: `Are you sure you want to delete "${file.name}"? This action cannot be undone.`,
                            variant: 'danger',
                            onConfirm: async () => {
                              try {
                                const response = await fetch(`/api/projects/${projectId}/files/${file._id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'X-Session-ID': localStorage.getItem('sessionId') || '',
                                  },
                                  credentials: 'include',
                                });
                                
                                if (response.ok) {
                                  showSuccess('File deleted successfully!');
                                  loadProject();
                                } else {
                                  const error = await response.json();
                                  showError(error.message || 'Failed to delete file');
                                }
                              } catch (error) {
                                showError('Failed to delete file');
                              }
                            }
                          });
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No files uploaded yet.</p>
        )}
      </div>
      
      {/* Project Members */}
      {isMember && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Members</h2>
              <span className="px-3 py-1 text-sm font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {members.length}
              </span>
            </div>
            <Button onClick={() => setShowAddMemberModal(true)} size="sm">
              Add Member
            </Button>
          </div>
          
          <Card className="p-4">
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member._id} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {member.profileImage ? (
                        <img
                          src={`${member.profileImage}`}
                          alt={member.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {member.name}
                        {member._id === ownerId && <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">Owner</span>}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">@{member.username}</p>
                    </div>
                  </div>
                  {isOwner && member._id !== ownerId && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoveMember(member._id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
          
          {isOwner && members.length > 1 && (
            <div className="mt-4">
              <Button variant="secondary" onClick={() => setShowTransferOwnershipModal(true)}>
                Transfer Ownership
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Activity Feed */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Activity</h2>
        {activities.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No activity yet.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity._id} className="p-4">
                <p className="text-gray-800 dark:text-gray-200">
                  {activity.type === 'check-in' ? 'Checked in' : 'Checked out'}
                  {activity.message && ` - "${activity.message}"`}
                  {activity.versionNumber && ` (v${activity.versionNumber})`}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Discussion Board */}
      {isMember && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Discussion</h2>
          
          <div className="mb-4">
            <textarea
              value={discussionMessage}
              onChange={(e) => setDiscussionMessage(e.target.value)}
              placeholder="Add to discussion..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <Button onClick={handleAddDiscussion} className="mt-2">
              Post
            </Button>
          </div>
          
          <div className="space-y-4">
            {discussions.map((discussion) => {
              // Handle populated userId
              const author = typeof discussion.userId === 'object' ? (discussion.userId as any) : null;
              const authorName = author?.name || 'Unknown User';
              const authorImage = author?.profileImage || null;
              
              return (
                <Card key={discussion._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {authorImage ? (
                        <img
                          src={`${authorImage}`}
                          alt={authorName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        authorName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{authorName}</p>
                          <span className="text-gray-400 dark:text-gray-500">•</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(discussion.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {/* Edit/Delete buttons for author or admin */}
                        {(author && author._id === currentUser?._id) || currentUser?.isAdmin ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setPromptDialog({
                                  isOpen: true,
                                  title: 'Edit Discussion',
                                  message: 'Edit your discussion message:',
                                  defaultValue: discussion.message,
                                  onConfirm: async (newMessage) => {
                                    if (!newMessage || newMessage === discussion.message) return;
                                    
                                    try {
                                      // Admin uses admin API
                                      const endpoint = currentUser?.isAdmin && author?._id !== currentUser?._id
                                        ? `/api/admin/discussions/${discussion._id}`
                                        : `/api/discussions/${discussion._id}`;
                                      
                                      const response = await fetch(endpoint, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'X-Session-ID': localStorage.getItem('sessionId') || '',
                                        },
                                        credentials: 'include',
                                        body: JSON.stringify({ message: newMessage }),
                                      });
                                      
                                      if (response.ok) {
                                        showSuccess('Discussion updated successfully!');
                                        loadProject(); // Reload to show updated discussion
                                      } else {
                                        showError('Failed to edit discussion');
                                      }
                                    } catch (error) {
                                      showError('Failed to edit discussion');
                                    }
                                  }
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Delete Discussion',
                                  message: 'Are you sure you want to delete this discussion post? This action cannot be undone.',
                                  variant: 'danger',
                                  onConfirm: async () => {
                                    try {
                                      // Admin uses admin API
                                      const endpoint = currentUser?.isAdmin && author?._id !== currentUser?._id
                                        ? `/api/admin/discussions/${discussion._id}`
                                        : `/api/discussions/${discussion._id}`;
                                      
                                      const response = await fetch(endpoint, {
                                        method: 'DELETE',
                                        headers: {
                                          'X-Session-ID': localStorage.getItem('sessionId') || '',
                                        },
                                        credentials: 'include',
                                      });
                                      
                                      if (response.ok) {
                                        showSuccess('Discussion deleted successfully!');
                                        loadProject(); // Reload to show updated list
                                      } else {
                                        showError('Failed to delete discussion');
                                      }
                                    } catch (error) {
                                      showError('Failed to delete discussion');
                                    }
                                  }
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      <p className="text-gray-800 dark:text-gray-200">{discussion.message}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Check-in Modal */}
      <Modal
        isOpen={showCheckinModal}
        onClose={() => {
          setShowCheckinModal(false);
          setCheckinFiles([]);
        }}
        title="Check In Project"
        footer={
          <>
            <Button variant="secondary" onClick={() => {
              setShowCheckinModal(false);
              setCheckinFiles([]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCheckin}>
              Check In
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Version"
            value={checkinVersion}
            onChange={(e) => setCheckinVersion(e.target.value)}
            placeholder="1.0.0"
          />
          <div>
            <label htmlFor="checkin-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Check-in Message
            </label>
            <textarea
              id="checkin-message"
              value={checkinMessage}
              onChange={(e) => setCheckinMessage(e.target.value)}
              placeholder="Describe the changes..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>
          
          <div>
            <label htmlFor="checkin-files" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload New/Updated Files (Optional)
            </label>
            <input
              id="checkin-files"
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setCheckinFiles(Array.from(e.target.files));
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {checkinFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{checkinFiles.length} file(s) selected:</p>
                {checkinFiles.map((file, index) => (
                  <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    • {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
      
      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Add Member"
      >
        <div className="space-y-3">
          {friends.filter(friend => !project?.members.includes(friend._id)).length === 0 ? (
            <p className="text-gray-600">All your friends are already members of this project.</p>
          ) : (
            friends
              .filter(friend => !project?.members.includes(friend._id))
              .map(friend => (
                <div key={friend._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
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
                    <div>
                      <p className="font-medium text-gray-900">{friend.name}</p>
                      <p className="text-sm text-gray-600">@{friend.username}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleAddMember(friend._id)}>
                    Add
                  </Button>
                </div>
              ))
          )}
        </div>
      </Modal>
      
      {/* Transfer Ownership Modal */}
      <Modal
        isOpen={showTransferOwnershipModal}
        onClose={() => setShowTransferOwnershipModal(false)}
        title="Transfer Ownership"
      >
        <div className="space-y-3">
          <p className="text-gray-600 mb-4">Select a member to transfer ownership to:</p>
          {members.filter(member => member._id !== ownerId).map(member => (
            <div key={member._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {member.profileImage ? (
                    <img
                      src={`${member.profileImage}`}
                      alt={member.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    member.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">@{member.username}</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleSelectNewOwner(member)}>
                Select
              </Button>
            </div>
          ))}
        </div>
      </Modal>
      
      {/* Transfer Ownership Confirmation Modal */}
      <Modal
        isOpen={showTransferConfirmModal}
        onClose={() => {
          setShowTransferConfirmModal(false);
          setSelectedNewOwner(null);
          setShowTransferOwnershipModal(true);
        }}
        title="Confirm Ownership Transfer"
      >
        {selectedNewOwner && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                    Warning: This action cannot be undone
                  </h3>
                  <p className="text-sm text-yellow-700">
                    You are about to transfer ownership of this project. You will no longer be the owner and will only have member privileges.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">Transferring ownership to:</p>
              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {selectedNewOwner.profileImage ? (
                    <img
                      src={`${selectedNewOwner.profileImage}`}
                      alt={selectedNewOwner.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    selectedNewOwner.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedNewOwner.name}</p>
                  <p className="text-sm text-gray-600">@{selectedNewOwner.username}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                variant="danger" 
                onClick={handleTransferOwnership}
                className="flex-1"
              >
                Confirm Transfer
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowTransferConfirmModal(false);
                  setSelectedNewOwner(null);
                  setShowTransferOwnershipModal(true);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* File View Modal */}
      <Modal
        isOpen={showFileViewModal}
        onClose={() => {
          setShowFileViewModal(false);
          setViewingFile(null);
        }}
        title={viewingFile?.name || 'Viewing File'}
      >
        {viewingFile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 pb-3 border-b dark:border-gray-700">
              <span>Type: {viewingFile.type}</span>
              <span>Size: {(viewingFile.size / 1024).toFixed(2)} KB</span>
            </div>
            
            {/* Check if it's an image file */}
            {viewingFile.isImage ? (
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center">
                <img
                  src={`${viewingFile.url}`}
                  alt={viewingFile.name}
                  className="max-w-full max-h-[600px] object-contain rounded"
                />
              </div>
            ) : (
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap break-words">
                  {viewingFile.contents}
                </pre>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-2">
              {!viewingFile.isImage && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(viewingFile.contents);
                    showSuccess('Code copied to clipboard!');
                  }}
                >
                  Copy to Clipboard
                </Button>
              )}
              <Button
                onClick={() => {
                  setShowFileViewModal(false);
                  setViewingFile(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
      />
      
      {/* Prompt Dialog */}
      <PromptDialog
        isOpen={promptDialog.isOpen}
        onClose={() => setPromptDialog({ ...promptDialog, isOpen: false })}
        onConfirm={promptDialog.onConfirm}
        title={promptDialog.title}
        message={promptDialog.message}
        defaultValue={promptDialog.defaultValue}
        validation={promptDialog.validation}
        validationMessage={promptDialog.validationMessage}
      />
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};
