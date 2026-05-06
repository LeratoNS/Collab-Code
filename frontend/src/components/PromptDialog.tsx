// Lerato Sibanda u22705504 P14

import * as React from 'react';
const { useState } = React;
import { Button } from './Button';
import { Input } from './Input';

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  validation?: (value: string) => boolean;
  validationMessage?: string;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Input Required',
  message,
  placeholder = '',
  defaultValue = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  validation,
  validationMessage = 'Invalid input'
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    if (validation && !validation(value)) {
      setError(validationMessage);
      return;
    }
    onConfirm(value);
    setValue(defaultValue);
    setError('');
    onClose();
  };
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
          />
          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>
          )}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => {
              setValue(defaultValue);
              setError('');
              onClose();
            }}>
              {cancelText}
            </Button>
            <Button onClick={handleConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

