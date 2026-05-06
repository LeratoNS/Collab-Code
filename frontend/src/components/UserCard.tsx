// Lerato Sibanda u22705504 P14
import * as React from 'react';
import { User } from '../types';
import { Card } from './Card';
import { useNavigate } from 'react-router-dom';

interface UserCardProps {
  user: User;
  showDetails?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({ user, showDetails = false }) => {
  const navigate = useNavigate();
  
  return (
    <Card
      className="p-4 cursor-pointer"
      onClick={() => navigate(`/profile/${user._id}`)}
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
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
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
            {user.isVerified && (
              <span className="text-blue-500 dark:text-blue-300" title="Verified">
                ✓
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-200">@{user.username}</p>
          {showDetails && (
            <>
              {user.bio && <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">{user.bio}</p>}
              {user.work && (
                <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">Works at {user.work}</p>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
