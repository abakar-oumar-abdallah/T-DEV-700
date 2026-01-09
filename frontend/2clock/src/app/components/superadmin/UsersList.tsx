import React from 'react';
import { UsersIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  permission: 'user' | 'admin' | 'superadmin';
  phone_number?: string;
  created_at: string;
  user_team?: Array<{
    id: number;
    role: string;
    team: {
      id: number;
      name: string;
    };
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsersListProps {
  users: User[];
  loading: boolean;
  pagination: Pagination | null;
  onEditPermission: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onPageChange: (page: number) => void;
}

const getPermissionBadgeColor = (permission: string) => {
  switch (permission) {
    case 'superadmin': return 'bg-red-500 text-white';
    case 'admin': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getPermissionLabel = (permission: string) => {
  switch (permission) {
    case 'superadmin': return 'Superadmin';
    case 'admin': return 'Admin';
    default: return 'Utilisateur';
  }
};

export default function UsersList({ 
  users, 
  loading, 
  pagination, 
  onEditPermission, 
  onDeleteUser,
  onPageChange 
}: UsersListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500">Aucun utilisateur trouvé</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
        {users.map((user) => (
          <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {user.first_name} {user.last_name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPermissionBadgeColor(user.permission)}`}>
                    {getPermissionLabel(user.permission)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1 truncate">{user.email}</p>
                {user.user_team && user.user_team.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user.user_team.length} équipe{user.user_team.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onEditPermission(user)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier les permissions"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDeleteUser(user)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer l'utilisateur"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>


      {pagination && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {pagination.page} sur {pagination.totalPages} 
            <span className="ml-2 text-gray-500">
              ({pagination.total} utilisateur{pagination.total > 1 ? 's' : ''})
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Précédent
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </>
  );
}