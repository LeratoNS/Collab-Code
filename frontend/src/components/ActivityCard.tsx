// Lerato Sibanda u22705504 P14
import * as React from 'react';
import { Activity, User, Project } from '../types';
import { Card } from './Card';

interface ActivityCardProps {
  activity: Activity;
  user?: User;
  project?: Project;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, user, project }) => {
  const getActivityText = () => {
    switch (activity.type) {
      case 'create-project':
        return 'created a new project';
      case 'check-in':
        return 'checked in';
      case 'check-out':
        return 'checked out';
      case 'add-member':
        return 'added a member to';
      default:
        return 'updated';
    }
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {/* User Profile Image */}
        <div className="flex-shrink-0">
          {user?.profileImage ? (
            <img
              src={`${user.profileImage}`}
              alt={user.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-400 dark:border-blue-600"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg border-2 border-blue-400 dark:border-blue-600">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
        
        {/* Activity Content */}
        <div className="flex-1">
          <p className="text-gray-800 dark:text-gray-100">
            <span className="font-semibold dark:text-white">{user?.name || 'Unknown User'}</span>
            {' '}
            {getActivityText()}
            {' '}
            <span className="font-semibold dark:text-white">{project?.name || 'Unknown Project'}</span>
          </p>
          {activity.message && (
            <p className="text-gray-600 dark:text-gray-200 mt-2 italic">"{activity.message}"</p>
          )}
          {activity.versionNumber && (
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Version: {activity.versionNumber}</p>
          )}
          <p className="text-sm text-gray-400 dark:text-gray-400 mt-2">{formatDate(activity.createdAt)}</p>
        </div>
      </div>
    </Card>
  );
};
