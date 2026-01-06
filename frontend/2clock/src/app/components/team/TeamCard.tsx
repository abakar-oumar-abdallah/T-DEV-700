import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  BuildingOffice2Icon, 
  ClockIcon, 
  UserGroupIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface Team {
  id: string;
  role: string;
  planning_id?: string;
  team: {
    id: number;
    name: string;
    description?: string;
    lateness_limit: number;
    timezone: string;
    default_planning_id?: string;
  };
}

interface TeamCardProps {
  team: Team;
  index: number;
  mounted: boolean;
  loading: boolean;
  canManage: boolean;
  onSelect: (team: Team) => void;
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
  setCurrentTeam: (team: Team) => void;
}

export default function TeamCard({
  team,
  index,
  mounted,
  loading,
  canManage,
  onSelect,
  onEdit,
  onDelete,
  setCurrentTeam
}: TeamCardProps) {
  const router = useRouter();

  const getRoleColor = (role: string) => 
    role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  return (
    <div
      className={`group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${200 + index * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
          <BuildingOffice2Icon className="h-6 w-6 text-blue-600" />
        </div>

        {canManage && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(team);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Modifier l'équipe"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(team);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer l'équipe"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.team.name}</h3>
        {team.team.description && (
          <p className="text-sm text-gray-600 mb-3">{team.team.description}</p>
        )}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(team.role)}`}>
          {team.role === 'manager' ? 'Responsable' : 'Employé'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-4 w-4" />
          <span>{team.team.timezone}</span>
        </div>
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="h-4 w-4" />
          <span>Limite retard: {team.team.lateness_limit} min</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Planning {team.planning_id ? 'personnalisé' : 'par défaut'}
        </span>
        <div className={`w-2 h-2 rounded-full ${team.planning_id ? 'bg-green-400' : 'bg-blue-400'}`}></div>
      </div>

      {/* Action buttons */}
      <div className={`mt-4 flex gap-2 ${team.role === 'manager' ? 'flex-col' : ''}`}>
        {team.role === 'manager' && (
          <button
            onClick={() => {
              setCurrentTeam(team);
              router.push('/dashboard/manager/team');
            }}
            disabled={loading}
            className="w-full flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserGroupIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Voir membres</span>
          </button>
        )}

        <button
          onClick={() => onSelect(team)}
          disabled={loading}
          className="w-full flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)] hover:to-[#ff6b4a] text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-sm font-medium">Sélectionner</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}