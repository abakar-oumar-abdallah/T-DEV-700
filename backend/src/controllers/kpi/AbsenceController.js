const supabase = require('../../../config/supabaseClient.js');
class AbsenceController {
    
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
        const { startDate, endDate } = req.query;
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

                // Use provided date range or default to created_at + 1 day to today
                const startCheckDate = startDate 
                    ? new Date(startDate + 'T00:00:00')
                    : new Date(new Date(userTeam.created_at).getTime() + 24 * 60 * 60 * 1000);
                const endCheckDate = endDate 
                    ? new Date(endDate + 'T23:59:59')
                    : new Date();

                // Get ALL clocks for this user
                const { data: clocks } = await supabase
                    .from('clock')
                    .select('id, arrival_time, departure_time')
                    .eq('user_team_id', userTeam.id)
                    .order('arrival_time', { ascending: true });

                // Build map of dates with clocks
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

                // Iterate through each day in the range
                let currentDate = new Date(startCheckDate);
                const endDate2 = new Date(endCheckDate);
                
                while (currentDate <= endDate2) {
                    const dateStr = normalizeDateToString(currentDate);
                    const dayOfWeek = currentDate.getDay();
                    const dayName = dayNames[dayOfWeek];

                    // Check if user should work on this day according to planning
                    const daySchedule = activePlanning.schedule.find(s => s.day === dayName);
                    
                    // Only consider it an absence if:
                    // 1. There's a schedule for this day (user should work)
                    // 2. There's no clock for this date
                    if (daySchedule && daySchedule.time_in && daySchedule.time_out) {
                        const clocksOnDate = clocksByDate.get(dateStr) || [];
                        
                        if (clocksOnDate.length === 0) {
                            // No clock at all - this is an absence
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

                    // Move to next day
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
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
                    continue;
                }

                const firstSlot = expectedSchedule[0];
                const arrivalTime = `${normalizedDate}T${firstSlot.start}`;
                const departureTime = `${normalizedDate}T${firstSlot.end}`;

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

module.exports = new AbsenceController();