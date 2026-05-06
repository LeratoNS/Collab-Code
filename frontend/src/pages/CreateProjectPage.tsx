// Lerato Sibanda u22705504 P14
import * as React from 'react';
const { useState, useEffect } = React;
import { useNavigate } from 'react-router-dom';
import { projectApi, projectTypeApi } from '../api';
import { ProjectType } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    version: '1.0.0',
    hashtags: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  
  useEffect(() => {
    loadProjectTypes();
  }, []);
  
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
  
  const loadProjectTypes = async () => {
    try {
      const response = await projectTypeApi.getProjectTypes();
      if (response.success && response.data) {
        setProjectTypes(response.data);
      }
    } catch (error) {
      console.error('Failed to load project types:', error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (imageError) {
      alert('Please fix the image size issue before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('version', formData.version);
      
      // Convert hashtags string to array
      const hashtagsArray = formData.hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      formDataToSend.append('hashtags', JSON.stringify(hashtagsArray));
      
      // Add image
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      // Add project files
      projectFiles.forEach((file) => {
        formDataToSend.append('files', file);
      });
      
      const response = await projectApi.createProject(formDataToSend);
      if (response.success && response.data) {
        navigate(`/project/${response.data._id}`);
      }
    } catch (error) {
      console.error('Project creation error:', error);
      alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (file.size <= maxSize) {
        resolve(file);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate scale to get under 5MB (rough estimation)
          const scale = Math.sqrt(maxSize / file.size);
          width = width * scale;
          height = height * scale;
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          }, file.type, 0.9);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };
  
  const handleImageChange = async (file: File) => {
    setImageError(null);
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (file.size > maxSize) {
      if (confirm(`Image is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Would you like to automatically resize it to under 5MB?`)) {
        try {
          const resizedFile = await resizeImage(file);
          setImageFile(resizedFile);
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
          };
          reader.readAsDataURL(resizedFile);
        } catch (error) {
          setImageError('Failed to resize image. Please choose a smaller image.');
        }
      } else {
        setImageError('Image must be under 5MB');
      }
    } else {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageChange(e.target.files[0]);
    }
  };
  
  const handleProjectFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Add new files to existing files instead of replacing
      setProjectFiles([...projectFiles, ...Array.from(e.target.files)]);
    }
  };
  
  const removeProjectFile = (index: number) => {
    setProjectFiles(projectFiles.filter((_, i) => i !== index));
  };
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Create New Project</h1>
      
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Project Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>
          
          <div>
            <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Type
            </label>
            <select
              id="type-select"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a type</option>
              {projectTypes.map((type) => (
                <option key={type._id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Version"
            name="version"
            value={formData.version}
            onChange={handleChange}
            placeholder="1.0.0"
            required
          />
          
          <Input
            label="Programming Languages (comma-separated hashtags)"
            name="hashtags"
            value={formData.hashtags}
            onChange={handleChange}
            placeholder="JavaScript, TypeScript, Python"
          />
          
          {/* Project Icon with Drag & Drop */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Icon (Max 5MB)
            </label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDraggingImage
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : imageError
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingImage(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingImage(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Only set dragging to false if we're leaving the drop zone itself
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
                  setIsDraggingImage(false);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Close any open file dialogs
                const fileInputs = document.querySelectorAll('input[type="file"]');
                fileInputs.forEach((input: any) => {
                  input.blur();
                  input.value = '';
                });
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                  handleImageChange(files[0]);
                  // Remove drag state after successful drop
                  setTimeout(() => setIsDraggingImage(false), 100);
                } else {
                  setIsDraggingImage(false);
                }
              }}
            >
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded cursor-pointer"
                    onClick={() => {
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                      modal.onclick = () => modal.remove();
                      modal.innerHTML = `<img src="${imagePreview}" class="max-w-full max-h-full" />`;
                      document.body.appendChild(modal);
                    }}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {imageFile?.name} ({(imageFile!.size / (1024 * 1024)).toFixed(2)}MB)
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setImageError(null);
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    {isDraggingImage ? 'Drop image here' : 'Drag and drop your image here'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">or</p>
                  <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Browse Files
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Supports: JPG, PNG, GIF, WebP (Max 5MB)
                  </p>
                </div>
              )}
              
              {imageError && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">{imageError}</p>
              )}
            </div>
          </div>
          
          {/* Project Files with Drag & Drop */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Project Files (Optional)
            </label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDraggingFiles
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFiles(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFiles(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Only set dragging to false if we're leaving the drop zone itself
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX;
                const y = e.clientY;
                if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
                  setIsDraggingFiles(false);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Close any open file dialogs
                const fileInputs = document.querySelectorAll('input[type="file"]');
                fileInputs.forEach((input: any) => {
                  input.blur();
                  input.value = '';
                });
                
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  setProjectFiles([...projectFiles, ...files]);
                  // Remove drag state after successful drop
                  setTimeout(() => setIsDraggingFiles(false), 100);
                } else {
                  setIsDraggingFiles(false);
                }
              }}
            >
              {projectFiles.length > 0 ? (
                <div className="space-y-2">
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {projectFiles.length} file(s) selected
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {projectFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                          {file.name} ({(file.size / 1024).toFixed(2)}KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProjectFile(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mt-3">
                    Add More Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleProjectFilesChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-gray-600 dark:text-gray-400">
                    {isDraggingFiles ? 'Drop files here' : 'Drag and drop your project files here'}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">or</p>
                  <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Browse Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleProjectFilesChange}
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add code files, documentation, or any other project files
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
