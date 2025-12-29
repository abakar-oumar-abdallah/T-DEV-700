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


    // Lateness rate by team

    // Overtime rate by team

}

module.exports = new KpiController();