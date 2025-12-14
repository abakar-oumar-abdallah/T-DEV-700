const supabase = require('../../../config/supabaseClient.js');

class KpiController {

    /**
     * Get lateness rate by employee for a team
     */
    async getLatenessRateByEmployee(req, res) {
        try {
            const { teamId, userId } = req.params;
            const days = req.query.days ? parseInt(req.query.days) : null; // null = all time

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

            // Get team lateness limit
            const { data: team, error: teamError } = await supabase
                .from('team')
                .select('lateness_limit, timezone')
                .eq('id', teamId)
                .single();

            if (teamError || !team) {
                return res.status(404).json({
                    success: false,
                    message: 'Team not found'
                });
            }

            const latenessLimit = team.lateness_limit;
            const timezone = team.timezone || 'UTC';

            // Calculate date range
            const endDate = new Date();
            let startDate = null;
            
            if (days !== null) {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - days);
            }

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
                .eq('user_team_id', userTeam.id)
                .not('arrival_time', 'is', null)
                .order('arrival_time', { ascending: false });

            // Apply date filter only if days is specified
            if (startDate !== null) {
                clockQuery = clockQuery
                    .gte('arrival_time', startDate.toISOString())
                    .lte('arrival_time', endDate.toISOString());
            }

            const { data: clocks, error: clocksError } = await clockQuery;

            if (clocksError) {
                console.error('Error fetching clocks:', clocksError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch clocks',
                    error: clocksError.message
                });
            }

            if (!clocks || clocks.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No clocks found for this period',
                    data: {
                        userId: parseInt(userId),
                        teamId: parseInt(teamId),
                        period: {
                            days: days || 'all',
                            startDate: startDate ? startDate.toISOString().split('T')[0] : 'all time',
                            endDate: endDate.toISOString().split('T')[0]
                        },
                        totalClocks: 0,
                        onTime: { count: 0, percentage: 0 },
                        early: { count: 0, percentage: 0 },
                        warning: { count: 0, percentage: 0 },
                        graveLateness: { count: 0, percentage: 0 }
                    }
                });
            }

            // Analyze each clock
            let onTimeCount = 0;
            let earlyCount = 0;
            let warningCount = 0;
            let graveLatenessCount = 0;

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
                    // Early: more than 5 minutes before scheduled time
                    earlyCount++;
                } else if (differenceMinutes >= -5 && differenceMinutes <= 0) {
                    // On time: between 5 minutes early and exactly on time
                    onTimeCount++;
                } else if (differenceMinutes > 0 && differenceMinutes <= latenessLimit) {
                    // Warning: late but within lateness limit
                    warningCount++;
                } else if (differenceMinutes > latenessLimit) {
                    // Grave lateness: late beyond lateness limit
                    graveLatenessCount++;
                }
            }

            const totalClocks = clocks.length;

            // Calculate percentages
            const calculatePercentage = (count) => 
                totalClocks > 0 ? Math.round((count / totalClocks) * 100 * 100) / 100 : 0;

            return res.status(200).json({
                success: true,
                message: 'Lateness rate calculated successfully',
                data: {
                    userId: parseInt(userId),
                    teamId: parseInt(teamId),
                    period: {
                        days: days || 'all',
                        startDate: startDate ? startDate.toISOString().split('T')[0] : 'all time',
                        endDate: endDate.toISOString().split('T')[0]
                    },
                    totalClocks,
                    onTime: {
                        count: onTimeCount,
                        percentage: calculatePercentage(onTimeCount)
                    },
                    early: {
                        count: earlyCount,
                        percentage: calculatePercentage(earlyCount)
                    },
                    warning: {
                        count: warningCount,
                        percentage: calculatePercentage(warningCount)
                    },
                    graveLateness: {
                        count: graveLatenessCount,
                        percentage: calculatePercentage(graveLatenessCount)
                    }
                }
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

    // Lateness rate by team

    // Overtime rate by employee

    // Overtime rate by team
}

module.exports = new KpiController();