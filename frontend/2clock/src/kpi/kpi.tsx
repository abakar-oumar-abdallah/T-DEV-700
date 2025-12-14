interface LatenessData {
  userId: number
  teamId: number
  period: { days: number | 'all'; startDate: string; endDate: string }
  totalClocks: number
  onTime: { count: number; percentage: number }
  early: { count: number; percentage: number }
  warning: { count: number; percentage: number }
  graveLateness: { count: number; percentage: number }
}

interface UserTeam {
  id: number
  user_id: number
  team_id: number
  role: string
  user: { id: number; first_name: string; last_name: string; email: string }
}

interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

const apiCall = async <T,>(url: string): Promise<ApiResponse<T>> => {
  try {
    const token = localStorage.getItem('session')
    if (!token) return { success: false, error: 'No authentication token found' }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }))
      return { success: false, error: errorData.error || errorData.message || 'Request failed' }
    }

    const result = await response.json()
    return { success: true, message: result.message, data: result.data }
  } catch (error) {
    console.error('API call error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

export const getLatenessRateByEmployee = (teamId: number, userId: number, days?: number | null) => {
  const url = days 
    ? `/kpi/teams/${teamId}/employees/${userId}/lateness?days=${days}`
    : `/kpi/teams/${teamId}/employees/${userId}/lateness`
  return apiCall<LatenessData>(url)
}

export const getTeamMembers = (teamId: number) =>
  apiCall<UserTeam[]>(`/teams/${teamId}/users`)

export type { LatenessData, UserTeam, ApiResponse as LatenessRateResponse, ApiResponse as TeamMembersResponse }