import React, { ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type ModalMode = 'creation' | 'update' | 'deletion' | 'none';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mode?: ModalMode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const getHeaderColor = (mode: ModalMode): string => {
  switch (mode) {
    case 'creation':
      return 'bg-[var(--color-primary)]';
    case 'update':
      return 'bg-[var(--color-secondary)]';
    case 'deletion':
      return 'bg-red-600';
    case 'none':
    default:
      return 'bg-white border-b border-gray-200';
  }
};

const getTextColor = (mode: ModalMode): string => {
  return mode === 'none' ? 'text-gray-900' : 'text-white';
};

const getCloseButtonColor = (mode: ModalMode): string => {
  return mode === 'none' 
    ? 'text-gray-400 hover:text-gray-600' 
    : 'text-white/80 hover:text-white';
};

const getMaxWidth = (size: string): string => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };
  return sizes[size as keyof typeof sizes] || sizes.md;
};

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  mode = 'none',
  children,
  maxWidth = 'md'
}: ModalProps) {
  if (!isOpen) return null;

  const headerColor = getHeaderColor(mode);
  const textColor = getTextColor(mode);
  const closeButtonColor = getCloseButtonColor(mode);
  const maxWidthClass = getMaxWidth(maxWidth);

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-gradient-to-br from-black/30 via-gray-900/20 to-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 16px 0;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      
      <div className={`bg-white rounded-2xl shadow-2xl ${maxWidthClass} w-full transform transition-all animate-slideUp max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`${headerColor} px-8 pt-8 pb-6 flex-shrink-0 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${textColor}`}>{title}</h2>
            <button
              onClick={onClose}
              className={`${closeButtonColor} transition-colors`}
              aria-label="Fermer"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 px-8 pb-8 pt-8">
          {children}
        </div>
      </div>
    </div>
  );
}