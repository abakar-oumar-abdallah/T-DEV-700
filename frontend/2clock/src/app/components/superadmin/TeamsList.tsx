import React from 'react';
import { BuildingOffice2Icon, TrashIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Team {
  id: number;
  name: string;
  description?: string;
  lateness_limit: number;
  timezone: string;
  created_at: string;
  memberCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface TeamsListProps {
  teams: Team[];
  loading: boolean;
  pagination: Pagination | null;
  onDeleteTeam: (team: Team) => void;
  onPageChange: (page: number) => void;
}

export default function TeamsList({ 
  teams, 
  loading, 
  pagination, 
  onDeleteTeam,
  onPageChange 
}: TeamsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500">Aucune équipe trouvée</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-100">
        {teams.map((team) => (
          <div key={team.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{team.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{team.description || 'Aucune description'}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="w-4 h-4" />
                    {team.memberCount} membre{team.memberCount > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    Limite retard: {team.lateness_limit} min
                  </span>
                  <span className="flex items-center gap-1">
                    <BuildingOffice2Icon className="w-4 h-4" />
                    {team.timezone}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => onDeleteTeam(team)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer l'équipe"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {pagination && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {pagination.page} sur {pagination.totalPages}
            <span className="ml-2 text-gray-500">
              ({pagination.total} équipe{pagination.total > 1 ? 's' : ''})
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