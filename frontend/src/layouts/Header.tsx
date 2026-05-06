// Lerato Sibanda u22705504 P14

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40 transition-colors">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Logo + Navigation */}
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto flex-1 min-w-0">
            <Link to="/home" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Logo - Clickable, takes you to home */}
              <img 
                src="/logo.png" 
                alt="CollabCode Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain hover:scale-110 transition-transform duration-200 cursor-pointer"
              />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                Collab<span className="text-purple-600 dark:text-purple-400">Code</span>
              </h1>
            </Link>
            
            {isAuthenticated && (
              <nav className="flex items-center gap-3 sm:gap-4 lg:gap-6 flex-shrink-0">
                <Link
                  to="/home"
                  className={`font-medium transition-colors relative pb-1 text-sm sm:text-base whitespace-nowrap ${
                    location.pathname === '/home'
                      ? 'text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Home
                </Link>
                
                {/* Show limited navigation for admin users */}
                {user?.isAdmin ? (
                  <>
                    <Link
                      to="/search"
                      className={`font-medium transition-colors relative pb-1 ${
                        location.pathname === '/search'
                          ? 'text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      Search
                    </Link>
                    <Link
                      to="/admin"
                      className={`font-medium transition-colors relative pb-1 ${
                        location.pathname === '/admin'
                          ? 'text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      Admin
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Full navigation for regular users */}
                    <Link
                      to={`/profile/${user?._id}`}
                      className={`font-medium transition-colors relative pb-1 ${
                        location.pathname.includes('/profile')
                          ? 'text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/my-projects"
                      className={`font-medium transition-colors relative pb-1 ${
                        location.pathname === '/my-projects'
                          ? 'text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      My Projects
                    </Link>
                    <Link
                      to="/search"
                      className={`font-medium transition-colors relative pb-1 ${
                        location.pathname === '/search'
                          ? 'text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      Search
                    </Link>
                    <Link
                      to="/create-project"
                      className={`font-medium transition-colors relative pb-1 ${
                        location.pathname === '/create-project'
                          ? 'text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      Create Project
                    </Link>
                    <Link
                      to="/friends"
                      className={`font-medium transition-colors relative pb-1 ${
                        location.pathname === '/friends'
                          ? 'text-blue-600 dark:text-blue-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 dark:after:bg-blue-400'
                          : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      Friends
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>
          
          {/* Right side: User profile + actions */}
          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to={`/profile/${user?._id}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold hover:ring-2 hover:ring-blue-400 transition-all">
                  {user?.profileImage ? (
                    <img
                      src={`${user.profileImage}`}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user?.name.charAt(0).toUpperCase()
                  )}
                </div>
              </Link>
              <Button size="sm" variant="ghost" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
