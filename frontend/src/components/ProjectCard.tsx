// Lerato Sibanda u22705504 P14

import * as React from 'react';
import { Project } from '../types';
import { Card } from './Card';
import { useNavigate } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const handleHashtagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/search?hashtag=${encodeURIComponent(tag)}`);
  };
  
  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/project/${project._id}`)}
    >
      {project.image && (
        <img
          src={`${project.image}`}
          alt={project.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h3>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              project.status === 'checked-in'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
            }`}
          >
            {project.status}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-200 mt-2 line-clamp-2">{project.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {project.hashtags.map((tag) => (
            <span
              key={tag}
              onClick={(e) => handleHashtagClick(e, tag)}
              className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title={`Search for #${tag}`}
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-300">
          <span>{project.type}</span>
          <span>v{project.version}</span>
        </div>
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-400">
          Created {formatDate(project.createdAt)}
        </div>
      </div>
    </Card>
  );
};
