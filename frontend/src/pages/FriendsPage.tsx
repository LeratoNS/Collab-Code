// Lerato Sibanda u22705504 P14
import * as React from 'react';
const { useState, useEffect } = React;
import { friendApi, userApi, authApi } from '../api';
import { FriendRequest, User } from '../types';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { UserCard } from '../components/UserCard';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';

export const FriendsPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load friend requests
      const requestsResponse = await friendApi.getFriendRequests();
      if (requestsResponse.success && requestsResponse.data) {
        setFriendRequests(requestsResponse.data);

        // Load user details for friend requests
        const userIds = new Set<string>();
        requestsResponse.data.forEach(req => {
          if (typeof req.senderId === 'string') userIds.add(req.senderId);
          if (typeof req.receiverId === 'string') userIds.add(req.receiverId);
        });

        const userPromises = Array.from(userIds).map(id => userApi.getUserById(id));
        const userResponses = await Promise.all(userPromises);

        const usersMap: Record<string, User> = {};
        userResponses.forEach(res => {
          if (res.success && res.data) {
            usersMap[res.data._id] = res.data;
          }
        });
        setUsers(usersMap);
      }

      // Load friends
      if (currentUser?.friends && currentUser.friends.length > 0) {
        const friendPromises = currentUser.friends.map(id => userApi.getUserById(id));
        const friendResponses = await Promise.all(friendPromises);

        const friendsData: User[] = [];
        friendResponses.forEach(res => {
          if (res.success && res.data) {
            friendsData.push(res.data);
          }
        });
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('Failed to load friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendApi.acceptFriendRequest(requestId);
      // Reload both friend requests and current user data
      const updatedUserResponse = await authApi.getCurrentUser();
      if (updatedUserResponse.success && updatedUserResponse.data) {
        // Update the current user in the auth store to get updated friends list
        const { login } = useAuthStore.getState();
        login(updatedUserResponse.data);
      }
      await loadData();
      setNotification({ message: 'Friend request accepted!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ message: 'Failed to accept friend request', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendApi.rejectFriendRequest(requestId);
      loadData();
      setNotification({ message: 'Friend request rejected', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ message: 'Failed to reject friend request', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleUnfriend = async (userId: string) => {
    // Find the user to get their name for the confirmation message
    const friendToUnfriend = friends.find(f => f._id === userId);
    const friendName = friendToUnfriend ? friendToUnfriend.name : 'this user';
    
    setConfirmDialog({
      isOpen: true,
      title: 'Unfriend User',
      message: `Are you sure you want to unfriend ${friendName}? You can always send them a friend request again later.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          await friendApi.unfriend(userId);
          showSuccess('Successfully unfriended user');
          loadData();
        } catch (error) {
          showError('Failed to unfriend user');
        }
      }
    });
  };

  const pendingRequests = friendRequests.filter(
    req => {
      const receiverId = typeof req.receiverId === 'object' ? (req.receiverId as any)?._id : req.receiverId;
      return receiverId === currentUser?._id;
    }
  );

  const sentRequests = friendRequests.filter(
    req => {
      const senderId = typeof req.senderId === 'object' ? (req.senderId as any)?._id : req.senderId;
      return senderId === currentUser?._id;
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Friends</h1>

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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'friends' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('friends')}
          className="flex items-center gap-2"
        >
          <span>My Friends</span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            {friends.length}
          </span>
        </Button>
        <Button
          variant={activeTab === 'requests' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('requests')}
          className="flex items-center gap-2"
        >
          <span>Friend Requests</span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
            {pendingRequests.length}
          </span>
        </Button>
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <Card className="p-6">
              <p className="text-gray-600 text-center">You don't have any friends yet.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {friends.map(friend => (
                <Card key={friend._id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{friend.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400">@{friend.username}</p>
                      {friend.bio && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{friend.bio}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => window.location.href = `/profile/${friend._id}`}
                        >
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUnfriend(friend._id)}
                        >
                          Unfriend
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friend Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Pending Requests */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span>Pending Requests</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {pendingRequests.length}
              </span>
            </h2>
            {pendingRequests.length === 0 ? (
              <Card className="p-6">
                <p className="text-gray-600 dark:text-gray-400 text-center">No pending friend requests.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(request => {
                  // Handle both populated (object) and unpopulated (string) IDs
                  const senderId = typeof request.senderId === 'object' 
                    ? (request.senderId as any)?._id 
                    : request.senderId;
                  const sender = users[senderId] || (typeof request.senderId === 'object' ? request.senderId : null);
                  if (!sender) return null;

                  return (
                    <Card key={request._id} className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {sender.profileImage ? (
                            <img
                              src={`${sender.profileImage}`}
                              alt={sender.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            sender.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{sender.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">@{sender.username}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAcceptRequest(request._id)}>
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRejectRequest(request._id)}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span>Sent Requests</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {sentRequests.length}
              </span>
            </h2>
            {sentRequests.length === 0 ? (
              <Card className="p-6">
                <p className="text-gray-600 dark:text-gray-400 text-center">No sent requests.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sentRequests.map(request => {
                  // Handle both populated (object) and unpopulated (string) IDs
                  const receiverId = typeof request.receiverId === 'object' 
                    ? (request.receiverId as any)?._id 
                    : request.receiverId;
                  const receiver = users[receiverId] || (typeof request.receiverId === 'object' ? request.receiverId : null);
                  if (!receiver) return null;

                  return (
                    <Card key={request._id} className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {receiver.profileImage ? (
                            <img
                              src={`${receiver.profileImage}`}
                              alt={receiver.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            receiver.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{receiver.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">@{receiver.username}</p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pending...</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      
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

