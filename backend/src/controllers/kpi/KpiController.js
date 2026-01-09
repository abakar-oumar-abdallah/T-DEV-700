const supabase = require('../../../config/supabaseClient.js');

class KpiController {

    /**
     * Helper function to calculate lateness statistics
     * @private
     */
    async calculateLatenessStats(userTeamId, teamId, userId, startDate, endDate) {
        // Get team lateness limit and timezone
        const { data: team, error: teamError } = await supabase
            .from('team')
            .select('lateness_limit, timezone')
            .eq('id', teamId)
            .single();

        if (teamError || !team) {
            return {
                success: false,
                status: 404,
                message: 'Team not found'
            };
        }

        const latenessLimit = team.lateness_limit;
        const timezone = team.timezone || 'UTC';

        // Build query for clocks
        let clockQuery = supabase
            .from('clock')
            .select(`
                id,
                arrival_time,
                planning_id,
                planning:planning_id (
                    id,
                    schedule (
                        id,
                        day,
                        time_in
                    )
                )
            `)
            .eq('user_team_id', userTeamId)
            .not('arrival_time', 'is', null)
            .order('arrival_time', { ascending: false });

        // Apply date filter if dates are specified
        if (startDate && endDate) {
            clockQuery = clockQuery
                .gte('arrival_time', startDate)
                .lte('arrival_time', endDate);
        }

        const { data: clocks, error: clocksError } = await clockQuery;

        if (clocksError) {
            console.error('Error fetching clocks:', clocksError);
            return {
                success: false,
                status: 500,
                message: 'Failed to fetch clocks',
                error: clocksError.message
            };
        }

        if (!clocks || clocks.length === 0) {
            return {
                success: true,
                status: 200,
                data: {
                    userId: parseInt(userId),
                    teamId: parseInt(teamId),
                    period: {
                        days: startDate ? 'custom' : 'all',
                        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : 'all time',
                        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    },
                    totalClocks: 0,
                    onTime: { count: 0, percentage: 0 },
                    early: { count: 0, percentage: 0, totalMinutes: 0 },
                    warning: { count: 0, percentage: 0, totalMinutes: 0 },
                    graveLateness: { count: 0, percentage: 0, totalMinutes: 0 }
                }
            };
        }

        // Analyze each clock
        let onTimeCount = 0;
        let earlyCount = 0;
        let warningCount = 0;
        let graveLatenessCount = 0;
        let totalEarlyMinutes = 0;
        let totalWarningMinutes = 0;
        let totalGraveLatenessMinutes = 0;

        for (const clock of clocks) {
            const arrivalTime = new Date(clock.arrival_time);
            const dayOfWeek = arrivalTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                timeZone: timezone 
            }).toLowerCase();

            // Find schedule for this day
            const schedule = clock.planning?.schedule?.find(s => s.day === dayOfWeek);
            
            if (!schedule || !schedule.time_in) {
                continue; // Skip if no schedule found
            }

            // Calculate actual arrival time in minutes
            const arrivalHour = arrivalTime.getHours();
            const arrivalMinute = arrivalTime.getMinutes();
            const arrivalMinutes = arrivalHour * 60 + arrivalMinute;

            // Calculate scheduled time in minutes
            const [schedHour, schedMinute] = schedule.time_in.split(':').map(Number);
            const scheduledMinutes = schedHour * 60 + schedMinute;

            // Calculate difference in minutes
            const differenceMinutes = arrivalMinutes - scheduledMinutes;

            if (differenceMinutes < -5) {
                earlyCount++;
                totalEarlyMinutes += Math.abs(differenceMinutes);
            } else if (differenceMinutes >= -5 && differenceMinutes <= 0) {
                onTimeCount++;
            } else if (differenceMinutes > 0 && differenceMinutes <= latenessLimit) {
                warningCount++;
                totalWarningMinutes += differenceMinutes;
            } else if (differenceMinutes > latenessLimit) {
                graveLatenessCount++;
                totalGraveLatenessMinutes += differenceMinutes;
            }
        }

        const totalClocks = clocks.length;
        const calculatePercentage = (count) => 
            totalClocks > 0 ? Math.round((count / totalClocks) * 100 * 100) / 100 : 0;

        return {
            success: true,
            status: 200,
            data: {
                userId: parseInt(userId),
                teamId: parseInt(teamId),
                period: {
                    days: startDate ? 'custom' : 'all',
                    startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : 'all time',
                    endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                },
                totalClocks,
                onTime: {
                    count: onTimeCount,
                    percentage: calculatePercentage(onTimeCount)
                },
                early: {
                    count: earlyCount,
                    percentage: calculatePercentage(earlyCount),
                    totalMinutes: totalEarlyMinutes
                },
                warning: {
                    count: warningCount,
                    percentage: calculatePercentage(warningCount),
                    totalMinutes: totalWarningMinutes
                },
                graveLateness: {
                    count: graveLatenessCount,
                    percentage: calculatePercentage(graveLatenessCount),
                    totalMinutes: totalGraveLatenessMinutes
                }
            }
        };
    }

    /**
     * Helper function to calculate departure statistics
     * @private
     */
    async calculateDepartureStats(userTeamId, teamId, userId, startDate, endDate) {
        // Get team timezone
        const { data: team, error: teamError } = await supabase
            .from('team')
            .select('timezone')
            .eq('id', teamId)
            .single();

        if (teamError || !team) {
            return {
                success: false,
                status: 404,
                message: 'Team not found'
            };
        }

        const timezone = team.timezone || 'UTC';

        // Build query for clocks
        let clockQuery = supabase
            .from('clock')
            .select(`
                id,
                departure_time,
                planning_id,
                planning:planning_id (
                    id,
                    schedule (
                        id,
                        day,
                        time_out
                    )
                )
            `)
            .eq('user_team_id', userTeamId)
            .not('departure_time', 'is', null)
            .order('departure_time', { ascending: false });

        // Apply date filter if dates are specified
        if (startDate && endDate) {
            clockQuery = clockQuery
                .gte('departure_time', startDate)
                .lte('departure_time', endDate);
        }

        const { data: clocks, error: clocksError } = await clockQuery;

        if (clocksError) {
            console.error('Error fetching clocks:', clocksError);
            return {
                success: false,
                status: 500,
                message: 'Failed to fetch clocks',
                error: clocksError.message
            };
        }

        if (!clocks || clocks.length === 0) {
            return {
                success: true,
                status: 200,
                data: {
                    userId: parseInt(userId),
                    teamId: parseInt(teamId),
                    period: {
                        days: startDate ? 'custom' : 'all',
                        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : 'all time',
                        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    },
                    totalClocks: 0,
                    onTime: { count: 0, percentage: 0 },
                    early: { count: 0, percentage: 0, totalMinutes: 0 },
                    overtime: { count: 0, percentage: 0, totalMinutes: 0 }
                }
            };
        }

        // Analyze each clock
        let onTimeCount = 0;
        let earlyCount = 0;
        let overtimeCount = 0;
        let totalEarlyMinutes = 0;
        let totalOvertimeMinutes = 0;

        for (const clock of clocks) {
            const departureTime = new Date(clock.departure_time);
            const dayOfWeek = departureTime.toLocaleDateString('en-US', {
                weekday: 'long',
                timeZone: timezone
            }).toLowerCase();

            // Find schedule for this day
            const schedule = clock.planning?.schedule?.find(s => s.day === dayOfWeek);

            if (!schedule || !schedule.time_out) {
                continue; // Skip if no schedule found
            }

            // Calculate actual departure time in minutes
            const departureHour = departureTime.getHours();
            const departureMinute = departureTime.getMinutes();
            const departureMinutes = departureHour * 60 + departureMinute;

            // Calculate scheduled time in minutes
            const [schedHour, schedMinute] = schedule.time_out.split(':').map(Number);
            const scheduledMinutes = schedHour * 60 + schedMinute;

            // Calculate difference in minutes
            const differenceMinutes = departureMinutes - scheduledMinutes;

            if (differenceMinutes < -5) {
                // Left early
                earlyCount++;
                totalEarlyMinutes += Math.abs(differenceMinutes);
            } else if (differenceMinutes >= -5 && differenceMinutes <= 5) {
                // On time (within 5 minutes)
                onTimeCount++;
            } else if (differenceMinutes > 5) {
                // Overtime
                overtimeCount++;
                totalOvertimeMinutes += differenceMinutes;
            }
        }

        const totalClocks = clocks.length;
        const calculatePercentage = (count) =>
            totalClocks > 0 ? Math.round((count / totalClocks) * 100 * 100) / 100 : 0;

        return {
            success: true,
            status: 200,
            data: {
                userId: parseInt(userId),
                teamId: parseInt(teamId),
                period: {
                    days: startDate ? 'custom' : 'all',
                    startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : 'all time',
                    endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                },
                totalClocks,
                onTime: {
                    count: onTimeCount,
                    percentage: calculatePercentage(onTimeCount)
                },
                early: {
                    count: earlyCount,
                    percentage: calculatePercentage(earlyCount),
                    totalMinutes: totalEarlyMinutes
                },
                overtime: {
                    count: overtimeCount,
                    percentage: calculatePercentage(overtimeCount),
                    totalMinutes: totalOvertimeMinutes
                }
            }
        };
    }

    /**
     * Get lateness rate by employee for a team
     */
    getLatenessRateByEmployee = async (req, res) => {
        try {
            const { teamId, userId } = req.params;
            const days = req.query.days ? parseInt(req.query.days) : null;
            const { startDate, endDate } = req.query;

            if (!teamId || !userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Team ID and User ID are required'
                });
            }

            if (days !== null && days <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Days must be greater than 0 or omitted for all-time data'
                });
            }

            // Get user-team association
            const { data: userTeam, error: userTeamError } = await supabase
                .from('user_team')
                .select('id')
                .eq('user_id', userId)
                .eq('team_id', teamId)
                .single();

            if (userTeamError || !userTeam) {
                return res.status(404).json({
                    success: false,
                    message: 'User is not a member of this team'
                });
            }

            // Cannot view KPI of owner
            if (userTeam.role === 'owner' && req.user.teamRole !== 'owner') {
                return res.status(403).json({
                success: false,
                message: 'Forbidden - Cannot view KPI of team owner'
                });
            }

            // Calculate date range
            let calculatedStartDate = null;
            let calculatedEndDate = null;

            if (startDate && endDate) {
                // Use provided date range
                calculatedStartDate = `${startDate}T00:00:00.000Z`;
                calculatedEndDate = `${endDate}T23:59:59.999Z`;
            } else if (days !== null) {
                // Calculate from days
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - days);
                calculatedStartDate = start.toISOString();
                calculatedEndDate = end.toISOString();
            }

            const result = await this.calculateLatenessStats(
                userTeam.id,
                teamId,
                userId,
                calculatedStartDate,
                calculatedEndDate
            );

            return res.status(result.status).json({
                success: result.success,
                message: result.message || 'Lateness rate calculated successfully',
                data: result.data,
                error: result.error
            });

        } catch (err) {
            console.error('Unexpected error in getLatenessRateByEmployee:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: err.message
            });
        }
    }

    //TODO : y ajouter le compte d'heures supp.
    getDepartureRateByEmployee = async (req, res) => {
        try {
            const { teamId, userId } = req.params;
            const days = req.query.days ? parseInt(req.query.days) : null;
            const { startDate, endDate } = req.query;

            if (!teamId || !userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Team ID and User ID are required'
                });
            }

            if (days !== null && days <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Days must be greater than 0 or omitted for all-time data'
                });
            }

            // Get user-team association
            const { data: userTeam, error: userTeamError } = await supabase
                .from('user_team')
                .select('id')
                .eq('user_id', userId)
                .eq('team_id', teamId)
                .single();

            if (userTeamError || !userTeam) {
                return res.status(404).json({
                    success: false,
                    message: 'User is not a member of this team'
                });
            }

            // Cannot view KPI of owner
            if (userTeam.role === 'owner' && req.user.teamRole !== 'owner') {
                return res.status(403).json({
                success: false,
                message: 'Forbidden - Cannot view KPI of team owner'
                });
            }


            // Calculate date range
            let calculatedStartDate = null;
            let calculatedEndDate = null;

            if (startDate && endDate) {
                // Use provided date range
                calculatedStartDate = `${startDate}T00:00:00.000Z`;
                calculatedEndDate = `${endDate}T23:59:59.999Z`;
            } else if (days !== null) {
                // Calculate from days
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - days);
                calculatedStartDate = start.toISOString();
                calculatedEndDate = end.toISOString();
            }

            const result = await this.calculateDepartureStats(
                userTeam.id,
                teamId,
                userId,
                calculatedStartDate,
                calculatedEndDate
            );

            return res.status(result.status).json({
                success: result.success,
                message: result.message || 'Departure rate calculated successfully',
                data: result.data,
                error: result.error
            });

        } catch (err) {
            console.error('Unexpected error in getDepartureRateByEmployee:', err);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: err.message
            });
        }
    }

/**
 * Get absences for a user in a team
 */
async getAbsences(req, res) {
    try {
        const { teamId, userId } = req.params;
        const { startDate, endDate, page = 1, limit = 20 } = req.query;

        // Check if user has permission
        const { data: requestingUserTeam } = await supabase
            .from('user_team')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', req.user.userId)
            .single();

        if (!requestingUserTeam || (requestingUserTeam.role !== 'manager' && requestingUserTeam.role !== 'owner')) {
            return res.status(403).json({
                success: false,
                message: 'Only managers and owners can view absences'
            });
        }

        // Get user team info with planning
        const { data: userTeam, error: userTeamError } = await supabase
            .from('user_team')
            .select(`
                id, 
                created_at, 
                planning_id,
                user:user_id(id, first_name, last_name, email),
                planning:planning_id(
                    id,
                    schedule(
                        id,
                        day,
                        time_in,
                        time_out
                    )
                ),
                team:team_id(
                    default_planning_id,
                    default_planning:default_planning_id(
                        id,
                        schedule(
                            id,
                            day,
                            time_in,
                            time_out
                        )
                    )
                )
            `)
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .single();

        if (userTeamError || !userTeam) {
            return res.status(404).json({
                success: false,
                message: 'User not found in team'
            });
        }

        // Determine which planning to use: user's planning or team's default
        const activePlanning = userTeam.planning || userTeam.team?.default_planning;

        if (!activePlanning || !activePlanning.schedule || activePlanning.schedule.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No planning found for user',
                data: {
                    absences: [],
                    pagination: {
                        total: 0,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: 0
                    },
                    user: userTeam.user,
                    userTeamId: userTeam.id,
                    dateRange: {
                        start: startDate || new Date(new Date(userTeam.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        end: endDate || new Date().toISOString().split('T')[0]
                    }
                }
            });
        }

        // Helper to normalize date to YYYY-MM-DD format
        const normalizeDateToString = (dateInput) => {
            // If it's a string in YYYY-MM-DD format, return as is
            if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                return dateInput;
            }
            
            const d = new Date(dateInput);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Calculate date range
        const startCheckDate = startDate 
            ? new Date(startDate + 'T00:00:00') 
            : new Date(new Date(userTeam.created_at).getTime() + 24 * 60 * 60 * 1000);
        
        const endCheckDate = endDate ? new Date(endDate + 'T23:59:59') : new Date();
        
        const startDateStr = normalizeDateToString(startCheckDate);
        const endDateStr = normalizeDateToString(endCheckDate);

        // Get ALL clocks for the user
        const { data: clocks, error: clocksError } = await supabase
            .from('clock')
            .select(`
                id, 
                arrival_time, 
                departure_time, 
                planning:planning_id(
                    id,
                    schedule(
                        id,
                        day,
                        time_in,
                        time_out
                    )
                )
            `)
            .eq('user_team_id', userTeam.id)
            .order('arrival_time', { ascending: true });

        if (clocksError) {
            console.error('Error fetching clocks:', clocksError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch clocks',
                error: clocksError.message
            });
        }

        // Helper to convert day number to day name
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        // Create a Map of dates that have clocks
        const clocksByDate = new Map();

        if (clocks && clocks.length > 0) {
            clocks.forEach(clock => {
                const clockDateStr = normalizeDateToString(clock.arrival_time);
                
                if (!clocksByDate.has(clockDateStr)) {
                    clocksByDate.set(clockDateStr, []);
                }
                clocksByDate.get(clockDateStr).push(clock);
            });
        }

        console.log('Checking absences from', startDateStr, 'to', endDateStr);
        console.log('Found', clocksByDate.size, 'dates with clocks');

        // Detect absences
        const absences = [];
        let currentDate = new Date(startDateStr + 'T00:00:00');
        const endDate2 = new Date(endDateStr + 'T00:00:00');

        while (currentDate <= endDate2) {
            const dateStr = normalizeDateToString(currentDate);
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
            const dayName = dayNames[dayOfWeek];

            // Check if user should work on this day
            const daySchedule = activePlanning.schedule.find(s => s.day === dayName);
            
            if (daySchedule && daySchedule.time_in && daySchedule.time_out) {
                // User should work this day
                const clocksOnDate = clocksByDate.get(dateStr) || [];
                
                if (clocksOnDate.length === 0) {
                    // No clock at all - complete absence
                    console.log('Absence detected on', dateStr, '(', dayName, ')');
                    absences.push({
                        date: dateStr,
                        dayOfWeek,
                        expectedSchedule: [{
                            start: daySchedule.time_in,
                            end: daySchedule.time_out
                        }],
                        planningId: activePlanning.id,
                        userTeamId: userTeam.id,
                        reason: 'missing_clock'
                    });
                } else {
                    // Check if any clock is incomplete
                    const incompleteClock = clocksOnDate.find(c => !c.departure_time);
                    if (incompleteClock) {
                        const clockPlanning = incompleteClock.planning || activePlanning;
                        const clockDaySchedule = clockPlanning?.schedule?.find(s => s.day === dayName);
                        
                        if (clockDaySchedule) {
                            console.log('Incomplete clock detected on', dateStr);
                            absences.push({
                                date: dateStr,
                                dayOfWeek,
                                expectedSchedule: [{
                                    start: clockDaySchedule.time_in,
                                    end: clockDaySchedule.time_out
                                }],
                                planningId: clockPlanning?.id,
                                userTeamId: userTeam.id,
                                reason: 'incomplete_clock',
                                clockId: incompleteClock.id
                            });
                        }
                    }
                }
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log('Total absences found:', absences.length);

        // Apply pagination AFTER detecting all absences
        const totalAbsences = absences.length;
        const totalPages = Math.ceil(totalAbsences / limit);
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIdx = (pageNum - 1) * limitNum;
        const paginatedAbsences = absences.slice(startIdx, startIdx + limitNum);

        res.status(200).json({
            success: true,
            message: 'Absences retrieved successfully',
            data: {
                absences: paginatedAbsences,
                pagination: {
                    total: totalAbsences,
                    page: pageNum,
                    limit: limitNum,
                    totalPages
                },
                user: userTeam.user,
                userTeamId: userTeam.id,
                dateRange: {
                    start: startDateStr,
                    end: endDateStr
                }
            }
        });

    } catch (err) {
        console.error('Unexpected error in getAbsences:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: err.message
        });
    }
}

/**
 * Fix absences by creating clock entries
 */
async fixAbsences(req, res) {
    try {
        const { teamId } = req.params;
        let { absences } = req.body;

        // Check if user has permission
        const { data: requestingUserTeam } = await supabase
            .from('user_team')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', req.user.userId)
            .single();

        if (!requestingUserTeam || (requestingUserTeam.role !== 'manager' && requestingUserTeam.role !== 'owner')) {
            return res.status(403).json({
                success: false,
                message: 'Only managers and owners can fix absences'
            });
        }

        // Helper to normalize date to YYYY-MM-DD format
        const normalizeDateToString = (dateInput) => {
            if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                return dateInput;
            }
            
            const d = new Date(dateInput);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // If empty array or not provided, fetch ALL absences for all users in team
        if (!absences || absences.length === 0) {
            console.log('No absences provided, fetching all absences for the team...');
            
            const { data: userTeams, error: userTeamsError } = await supabase
                .from('user_team')
                .select(`
                    id, 
                    created_at, 
                    planning_id,
                    user:user_id(id),
                    planning:planning_id(
                        id,
                        schedule(id, day, time_in, time_out)
                    ),
                    team:team_id(
                        default_planning_id,
                        default_planning:default_planning_id(
                            id,
                            schedule(id, day, time_in, time_out)
                        )
                    )
                `)
                .eq('team_id', teamId);

            if (userTeamsError) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch team members',
                    error: userTeamsError.message
                });
            }

            absences = [];
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            
            for (const userTeam of userTeams) {
                const activePlanning = userTeam.planning || userTeam.team?.default_planning;
                
                if (!activePlanning || !activePlanning.schedule || activePlanning.schedule.length === 0) {
                    continue;
                }

                const startCheckDate = new Date(new Date(userTeam.created_at).getTime() + 24 * 60 * 60 * 1000);
                const endCheckDate = new Date();

                const { data: clocks } = await supabase
                    .from('clock')
                    .select('id, arrival_time, departure_time')
                    .eq('user_team_id', userTeam.id)
                    .order('arrival_time', { ascending: true });

                const clocksByDate = new Map();
                if (clocks && clocks.length > 0) {
                    clocks.forEach(clock => {
                        const clockDateStr = normalizeDateToString(clock.arrival_time);
                        if (!clocksByDate.has(clockDateStr)) {
                            clocksByDate.set(clockDateStr, []);
                        }
                        clocksByDate.get(clockDateStr).push(clock);
                    });
                }

                let currentDate = new Date(startCheckDate);
                while (currentDate <= endCheckDate) {
                    const dateStr = normalizeDateToString(currentDate);
                    const dayOfWeek = currentDate.getDay();
                    const dayName = dayNames[dayOfWeek];

                    const daySchedule = activePlanning.schedule.find(s => s.day === dayName);
                    
                    if (daySchedule && daySchedule.time_in && daySchedule.time_out) {
                        const clocksOnDate = clocksByDate.get(dateStr) || [];
                        
                        if (clocksOnDate.length === 0) {
                            absences.push({
                                date: dateStr,
                                dayOfWeek,
                                expectedSchedule: [{
                                    start: daySchedule.time_in,
                                    end: daySchedule.time_out
                                }],
                                planningId: activePlanning.id,
                                userTeamId: userTeam.id,
                                reason: 'missing_clock'
                            });
                        }
                    }

                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }

            console.log(`Found ${absences.length} total absences to fix`);
        }

        if (absences.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No absences to fix',
                data: {
                    created: 0,
                    errors: 0
                }
            });
        }

        const createdClocks = [];
        const errors = [];

        for (const absence of absences) {
            try {
                const { date, userTeamId, planningId, expectedSchedule } = absence;

                if (!date || !userTeamId || !planningId || !expectedSchedule || expectedSchedule.length === 0) {
                    errors.push({ date, error: 'Missing required fields' });
                    continue;
                }

                const normalizedDate = normalizeDateToString(date);

                // Check if clock already exists for this date
                const startOfDay = `${normalizedDate}T00:00:00`;
                const endOfDay = `${normalizedDate}T23:59:59`;
                
                const { data: existingClocks } = await supabase
                    .from('clock')
                    .select('id, arrival_time')
                    .eq('user_team_id', userTeamId)
                    .gte('arrival_time', startOfDay)
                    .lte('arrival_time', endOfDay);

                if (existingClocks && existingClocks.length > 0) {
                    console.log(`Clock already exists for ${normalizedDate}, skipping`);
                    continue;
                }

                const firstSlot = expectedSchedule[0];
                const arrivalTime = `${normalizedDate}T${firstSlot.start}`;
                const departureTime = `${normalizedDate}T${firstSlot.end}`;

                console.log(`Creating clock for ${normalizedDate}: ${arrivalTime} - ${departureTime}`);

                const { data: newClock, error: clockError } = await supabase
                    .from('clock')
                    .insert({
                        user_team_id: userTeamId,
                        planning_id: planningId,
                        arrival_time: arrivalTime,
                        departure_time: departureTime
                    })
                    .select()
                    .single();

                if (clockError) {
                    console.error(`Error creating clock for ${normalizedDate}:`, clockError);
                    errors.push({ date: normalizedDate, error: clockError.message });
                } else {
                    console.log(`Successfully created clock for ${normalizedDate}`);
                    createdClocks.push(newClock);
                }

            } catch (err) {
                console.error(`Unexpected error fixing absence for ${absence.date}:`, err);
                errors.push({ date: absence.date, error: err.message });
            }
        }

        res.status(200).json({
            success: true,
            message: `Fixed ${createdClocks.length} absence(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`,
            data: {
                created: createdClocks.length,
                errors: errors.length,
                createdClocks,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (err) {
        console.error('Unexpected error in fixAbsences:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: err.message
        });
    }
}

}

module.exports = new KpiController();