// Lerato Sibanda u22705504 P14
import * as React from 'react';
const { useState, useEffect } = React;
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchApi } from '../api';
import { User, Project } from '../types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { UserCard } from '../components/UserCard';
import { ProjectCard } from '../components/ProjectCard';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || searchParams.get('hashtag') || '');
  const [searchType, setSearchType] = useState<'users' | 'projects'>('projects');
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isHashtagSearch, setIsHashtagSearch] = useState(false);
  
  // Autocomplete state
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Autocomplete as user types (faster than full search)
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      fetchAutocomplete(query);
    }, 150); // Faster debounce for autocomplete
    
    return () => clearTimeout(timeoutId);
  }, [query, searchType]);
  
  // Real-time search with debounce
  useEffect(() => {
    const hashtag = searchParams.get('hashtag');
    if (hashtag) {
      setQuery(hashtag);
      setIsHashtagSearch(true);
      setShowAutocomplete(false);
      performHashtagSearch(hashtag);
      return;
    }
    
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      setShowAutocomplete(false);
      performSearch(q);
      return;
    }
    
    if (!query.trim()) {
      setSearched(false);
      setUsers([]);
      setProjects([]);
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300); // Debounce: wait 300ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [query, searchParams]);
  
  const fetchAutocomplete = async (searchQuery: string) => {
    try {
      const endpoint = searchType === 'users' ? 'users' : 'projects';
      const response = await fetch(`/api/autocomplete/${endpoint}?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'X-Session-ID': localStorage.getItem('sessionId') || '',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAutocompleteResults(data.data);
          setShowAutocomplete(data.data.length > 0);
        }
      }
    } catch (error) {
      console.error('Autocomplete failed:', error);
    }
  };
  
  const performHashtagSearch = async (hashtag: string) => {
    setLoading(true);
    setSearched(true);
    setSearchType('projects');
    setShowAutocomplete(false);
    
    try {
      const response = await fetch(`/api/search/projects?hashtag=${encodeURIComponent(hashtag)}`, {
        headers: {
          'X-Session-ID': localStorage.getItem('sessionId') || '',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setProjects(data.data);
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Hashtag search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setSearched(true);
    
    try {
      if (searchType === 'users') {
        const response = await searchApi.searchUsers(searchQuery);
        if (response.success && response.data) {
          setUsers(response.data);
          setProjects([]);
        }
      } else {
        const response = await searchApi.searchProjects(searchQuery);
        if (response.success && response.data) {
          setProjects(response.data);
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Update URL params
    setSearchParams({ q: query });
    setIsHashtagSearch(false);
    performSearch(query);
  };
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsHashtagSearch(false);
    setSelectedIndex(-1);
    
    // Show autocomplete as they type (min 2 chars)
    if (newQuery.length >= 2) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
    
    // Update URL params as user types
    if (newQuery.trim()) {
      setSearchParams({ q: newQuery });
    } else {
      setSearchParams({});
    }
  };
  
  const handleAutocompleteSelect = (item: any) => {
    setShowAutocomplete(false);
    
    // Navigate directly to the user or project page
    if (searchType === 'users') {
      navigate(`/profile/${item._id}`);
    } else {
      navigate(`/project/${item._id}`);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete || autocompleteResults.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < autocompleteResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleAutocompleteSelect(autocompleteResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {isHashtagSearch ? `Projects tagged with #${query}` : 'Search'}
      </h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <Input
              label={isHashtagSearch ? `Searching hashtag: #${query}` : "Search (auto-completes as you type)"}
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder={searchType === 'users' ? "Search by user name or username..." : "Search by project name..."}
              onFocus={() => {
                if (query.length >= 2 && autocompleteResults.length > 0) {
                  setShowAutocomplete(true);
                }
              }}
            />
            
            {/* Autocomplete Dropdown */}
            {showAutocomplete && autocompleteResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                {autocompleteResults.map((item, index) => (
                  <div
                    key={item._id}
                    onClick={() => handleAutocompleteSelect(item)}
                    className={`px-4 py-3 cursor-pointer flex items-center gap-3 border-b dark:border-gray-700 last:border-b-0 transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500 dark:border-l-blue-400'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {searchType === 'users' ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {item.profileImage ? (
                            <img
                              src={`${item.profileImage}`}
                              alt={item.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            item.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{item.username}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        {item.image && (
                          <img
                            src={`${item.image}`}
                            alt={item.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.type}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="search-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Type
            </label>
            <select
              id="search-type"
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value as 'users' | 'projects');
                setShowAutocomplete(false);
                if (query.trim()) {
                  performSearch(query);
                }
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="projects">Projects</option>
              <option value="users">Users</option>
            </select>
          </div>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 <strong>Users:</strong> Search by name/username | <strong>Projects:</strong> Search by name only | Supports incomplete terms & typos!
        </p>
      </form>
      
      {/* Results */}
      {searched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isHashtagSearch ? (
                <span>Projects with <span className="text-blue-600 dark:text-blue-400">#{query}</span></span>
              ) : (
                `Results for "${query}"`
              )}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {loading ? 'Searching...' : `${searchType === 'users' ? users.length : projects.length} result(s)`}
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : searchType === 'users' ? (
            users.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No users found. Try a different search term or check for typos.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </div>
            )
          ) : projects.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">No projects found. Try a different search term or check for typos.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
