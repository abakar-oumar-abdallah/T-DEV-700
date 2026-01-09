export interface LatenessData {
  userId: number
  teamId: number
  period: { days: number | 'all' | 'custom'; startDate: string; endDate: string }
  totalClocks: number
  onTime: { count: number; percentage: number }
  early: { count: number; percentage: number; totalMinutes: number }
  warning?: { count: number; percentage: number; totalMinutes: number }
  graveLateness?: { count: number; percentage: number; totalMinutes: number }
  overtime?: { count: number; percentage: number; totalMinutes: number }
}

export interface UserTeam {
  id: number
  user_id: number
  team_id: number
  role: string
  user: { id: number; first_name: string; last_name: string; email: string }
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface TimeSlot {
  start: string
  end: string
}

export interface Absence {
  date: string
  dayOfWeek: number
  expectedSchedule: TimeSlot[]
  planningId: number
  userTeamId: number
  reason: 'missing_clock' | 'incomplete_clock'
  clockId?: number
}

export interface AbsencesResponse {
  absences: Absence[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  user: {
    id: number
    first_name: string
    last_name: string
    email: string
  }
  userTeamId: number
  dateRange: {
    start: string
    end: string
  }
}

const apiCall = async <T,>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    const token = localStorage.getItem('session')
    if (!token) return { success: false, error: 'No authentication token found' }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKENDURL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers
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

export const getLatenessRateByEmployee = (
  teamId: number, 
  userId: number, 
  options?: { days?: number | null; startDate?: string; endDate?: string }
) => {
  let url = `/kpi/teams/${teamId}/employees/${userId}/lateness`
  const params = new URLSearchParams()
  
  if (options?.days !== undefined && options.days !== null) {
    params.append('days', options.days.toString())
  } else if (options?.startDate && options?.endDate) {
    params.append('startDate', options.startDate)
    params.append('endDate', options.endDate)
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`
  }
  
  return apiCall<LatenessData>(url)
}

export const getDepartureRateByEmployee = (
  teamId: number, 
  userId: number, 
  options?: { days?: number | null; startDate?: string; endDate?: string }
) => {
  let url = `/kpi/teams/${teamId}/employees/${userId}/departures`
  const params = new URLSearchParams()
  
  if (options?.days !== undefined && options.days !== null) {
    params.append('days', options.days.toString())
  } else if (options?.startDate && options?.endDate) {
    params.append('startDate', options.startDate)
    params.append('endDate', options.endDate)
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`
  }
  
  return apiCall<LatenessData>(url)
}

export const getAbsences = (
  teamId: number,
  userId: number,
  options?: { startDate?: string; endDate?: string; page?: number; limit?: number }
) => {
  let url = `/kpi/teams/${teamId}/users/${userId}/absences`
  const params = new URLSearchParams()
  
  if (options?.startDate) params.append('startDate', options.startDate)
  if (options?.endDate) params.append('endDate', options.endDate)
  if (options?.page) params.append('page', options.page.toString())
  if (options?.limit) params.append('limit', options.limit.toString())
  
  if (params.toString()) {
    url += `?${params.toString()}`
  }
  
  return apiCall<AbsencesResponse>(url)
}

export const fixAbsences = (teamId: number, absences: Absence[]) => {
  return apiCall<{ created: number; errors: number }>(`/kpi/teams/${teamId}/absences/fix`, {
    method: 'PATCH',
    body: JSON.stringify({ absences })
  })
}

export const getTeamMembers = (teamId: number) =>
  apiCall<UserTeam[]>(`/teams/${teamId}/users`)

export type { LatenessData as LatenessDataType, ApiResponse as LatenessRateResponse, ApiResponse as TeamMembersResponse }