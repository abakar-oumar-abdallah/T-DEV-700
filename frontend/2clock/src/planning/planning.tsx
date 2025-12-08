interface Schedule {
  day: string;
  time_in: string;
  time_out: string;
}

interface Planning {
  id: number;
  is_default: boolean;
  created_at: string;
  schedules?: Array<{
    id: number;
    planning_id: number;
    day: string;
    time_in: string;
    time_out: string;
  }>;
}

interface GetDefaultPlanningsResponse {
  success: boolean;
  data?: Planning[];
  message?: string;
  error?: string;
}

interface CreatePlanningData {
  is_default: boolean;
  schedules: Schedule[];
}

interface CreatePlanningResponse {
  success: boolean;
  data?: Planning;
  message?: string;
  error?: string;
}

export const GetDefaultPlannings = async (): Promise<GetDefaultPlanningsResponse> => {
  try {
    const token = localStorage.getItem('session');

    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

    const response = await fetch(`${backendUrl}/plannings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Failed to fetch plannings',
        error: errorData.message || errorData.error || 'Failed to fetch plannings'
      };
    }

    const result = await response.json();

    // Filter only default plannings
    const defaultPlannings = result.data?.filter((planning: Planning) => planning.is_default) || [];

    return {
      success: true,
      data: defaultPlannings
    };
  } catch (error) {
    console.error('GetDefaultPlannings error:', error);
    return {
      success: false,
      message: 'Failed to fetch plannings',
      error: 'Network error. Please try again.'
    };
  }
};

export const CreatePlanning = async (planningData: CreatePlanningData): Promise<CreatePlanningResponse> => {
  try {
    const token = localStorage.getItem('session');

    if (!token) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'No authentication token found'
      };
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

    const response = await fetch(`${backendUrl}/plannings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(planningData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      return {
        success: false,
        message: 'Failed to create planning',
        error: errorData.message || errorData.error || 'Failed to create planning'
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      message: result.message || 'Planning created successfully'
    };
  } catch (error) {
    console.error('CreatePlanning error:', error);
    return {
      success: false,
      message: 'Failed to create planning',
      error: 'Network error. Please try again.'
    };
  }
};
