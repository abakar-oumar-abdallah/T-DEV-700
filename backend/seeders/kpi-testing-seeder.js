const supabase = require('../config/supabaseClient');
const bcrypt = require('bcrypt');

// Helper function to generate random email
function generateRandomEmail(firstName, lastName) {
  const domains = ['example.com', 'test.com', 'demo.com', 'sample.org'];
  const randomNum = Math.floor(Math.random() * 1000);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${domain}`;
}

// Helper function to generate random date within last N days
function getRandomPastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

// Helper function to add minutes to time string
function addMinutesToTime(timeString, minutes) {
  const [hours, mins] = timeString.split(':').map(Number);
  let totalMinutes = hours * 60 + mins + minutes;
  
  // Handle day overflow
  if (totalMinutes >= 1440) totalMinutes -= 1440;
  if (totalMinutes < 0) totalMinutes += 1440;
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}:00`;
}

// Helper function to combine date and time (simple ISO format)
function combineDateAndTime(date, timeString) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, seconds || 0, 0);
  return combined.toISOString();
}

async function seedDatabase() {
  console.log('Starting comprehensive database seeding...\n');

  try {
    // Generate random team numbers
    const devTeamNumber = Math.floor(Math.random() * 900) + 100; // 100-999
    const salesTeamNumber = Math.floor(Math.random() * 900) + 100; // 100-999
    
    // Step 1: Create Plannings first (teams reference them)
    console.log('Creating plannings...');
    
    const { data: devPlanning, error: devPlanningError } = await supabase
      .from('planning')
      .insert([{
        is_default: false
      }])
      .select()
      .single();

    if (devPlanningError) throw new Error(`Error creating Dev Planning: ${devPlanningError.message}`);
    console.log(`Created planning for Dev Team (ID: ${devPlanning.id})`);

    const { data: salesPlanning, error: salesPlanningError } = await supabase
      .from('planning')
      .insert([{
        is_default: false
      }])
      .select()
      .single();

    if (salesPlanningError) throw new Error(`Error creating Sales Planning: ${salesPlanningError.message}`);
    console.log(`Created planning for Sales Team (ID: ${salesPlanning.id})\n`);

    // Step 2: Create Schedules for plannings
    console.log('Creating schedules...');
    
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const schedules = [];

    for (const day of weekDays) {
      // Dev team schedule
      schedules.push({
        planning_id: devPlanning.id,
        day: day,
        time_in: '07:00:00',
        time_out: '15:00:00'
      });

      // Sales team schedule
      schedules.push({
        planning_id: salesPlanning.id,
        day: day,
        time_in: '07:00:00',
        time_out: '15:00:00'
      });
    }

    const { error: scheduleError } = await supabase
      .from('schedule')
      .insert(schedules);

    if (scheduleError) throw new Error(`Error creating schedules: ${scheduleError.message}`);
    console.log(`Created ${schedules.length} schedules\n`);

    // Step 3: Create Teams with default_planning_id
    console.log('Creating teams...');
    
    const { data: devTeam, error: devTeamError } = await supabase
      .from('team')
      .insert([{
        name: `Developpers Team ${devTeamNumber}`,
        description: 'Development team for backend and frontend projects',
        lateness_limit: 15,
        timezone: 'Europe/Paris',
        default_planning_id: devPlanning.id
      }])
      .select()
      .single();

    if (devTeamError) throw new Error(`Error creating Dev Team: ${devTeamError.message}`);
    console.log(`Created team: ${devTeam.name} (ID: ${devTeam.id})`);

    const { data: salesTeam, error: salesTeamError } = await supabase
      .from('team')
      .insert([{
        name: `Sales Team ${salesTeamNumber}`,
        description: 'Sales and business development team',
        lateness_limit: 10,
        timezone: 'Europe/Paris',
        default_planning_id: salesPlanning.id
      }])
      .select()
      .single();

    if (salesTeamError) throw new Error(`Error creating Sales Team: ${salesTeamError.message}`);
    console.log(`Created team: ${salesTeam.name} (ID: ${salesTeam.id})\n`);

    // Step 4: Create Users
    console.log('Creating users...');
    
    const hashedPassword = await bcrypt.hash('azerty', 12);
    
    const usersData = [
      // Admin users (managers in at least one team)
      { 
        firstName: 'Alice', 
        lastName: 'Admin', 
        role: 'manager',
        permission: 'admin',
        teams: ['dev', 'sales'] // Manager in both
      },
      { 
        firstName: 'Bob', 
        lastName: 'Boss', 
        role: 'manager',
        permission: 'admin',
        teams: ['dev'] // Manager only in dev
      },
      
      // Dev Team members
      { 
        firstName: 'Charlie', 
        lastName: 'Developer', 
        role: 'employee',
        permission: 'user',
        teams: ['dev']
      },
      { 
        firstName: 'Diana', 
        lastName: 'DevOps', 
        role: 'employee',
        permission: 'user',
        teams: ['dev']
      },
      { 
        firstName: 'Eve', 
        lastName: 'Engineer', 
        role: 'employee',
        permission: 'user',
        teams: ['dev']
      },
      
      // Sales Team members
      { 
        firstName: 'Frank', 
        lastName: 'Seller', 
        role: 'manager',
        permission: 'user',
        teams: ['sales'] // Manager only in sales
      },
      { 
        firstName: 'Grace', 
        lastName: 'Growth', 
        role: 'employee',
        permission: 'user',
        teams: ['sales']
      },
      { 
        firstName: 'Henry', 
        lastName: 'Hunter', 
        role: 'employee',
        permission: 'user',
        teams: ['sales']
      },
      
      // Shared members
      { 
        firstName: 'Iris', 
        lastName: 'Intermediary', 
        role: 'employee',
        permission: 'user',
        teams: ['dev', 'sales'] // Employee in both
      },
      { 
        firstName: 'Jack', 
        lastName: 'Junior', 
        role: 'employee',
        permission: 'user',
        teams: ['dev', 'sales'] // Employee in both
      }
    ];

    const createdUsers = [];
    
    for (const userData of usersData) {
      const email = generateRandomEmail(userData.firstName, userData.lastName);
      
      const { data: user, error: userError } = await supabase
        .from('user')
        .insert([{
          email: email,
          password: hashedPassword,
          first_name: userData.firstName,
          last_name: userData.lastName,
          permission: userData.permission
        }])
        .select()
        .single();

      if (userError) throw new Error(`Error creating user ${userData.firstName}: ${userError.message}`);
      
      user.teams = userData.teams;
      user.role = userData.role;
      createdUsers.push(user);
      console.log(`Created user: ${user.first_name} ${user.last_name} (${user.email}) - ${userData.permission}`);
    }
    
    console.log(`\nCreated ${createdUsers.length} users\n`);

    // Step 5: Create User-Team associations
    console.log('Creating user-team associations...');
    
    for (const user of createdUsers) {
      for (const teamType of user.teams) {
        const team = teamType === 'dev' ? devTeam : salesTeam;
        const planning = teamType === 'dev' ? devPlanning : salesPlanning;
        const userData = usersData.find(u => u.firstName === user.first_name);
        
        const { data: userTeam, error: userTeamError } = await supabase
          .from('user_team')
          .insert([{
            user_id: user.id,
            team_id: team.id,
            planning_id: planning.id,
            role: userData.role
          }])
          .select()
          .single();

        if (userTeamError) throw new Error(`Error creating user-team: ${userTeamError.message}`);
        
        console.log(`Associated ${user.first_name} with ${team.name} (role: ${userData.role})`);
      }
    }
    
    console.log('\nCreating clock entries (100 per user)...\n');

    // Step 6: Create 100 clock entries per user
    let totalClocks = 0;
    
    for (const user of createdUsers) {
      console.log(`Creating clocks for ${user.first_name} ${user.last_name}...`);
      
      // Get user's team associations
      const { data: userTeams, error: userTeamsError } = await supabase
        .from('user_team')
        .select('*, team:team_id(*), planning:planning_id(*)')
        .eq('user_id', user.id);

      if (userTeamsError) {
        console.error(`Error fetching user teams: ${userTeamsError.message}`);
        continue;
      }

      // Use the first team for clock entries
      const primaryUserTeam = userTeams[0];
      if (!primaryUserTeam) continue;

      const teamLatenessLimit = primaryUserTeam.team.lateness_limit || 15;

      const clockEntries = [];
      const userBehavior = {
        lateChance: Math.random() > 0.7 ? 0.3 : 0.15,
        earlyChance: Math.random() > 0.7 ? 0.2 : 0.1,
        overtimeChance: Math.random() > 0.6 ? 0.4 : 0.15,
        leaveEarlyChance: Math.random() > 0.8 ? 0.2 : 0.1,
        graveLatenessChance: Math.random() > 0.6 ? 0.15 : 0.05
      };

      // Create 100 clock entries over the past 150 days
      let clocksCreated = 0;
      let attempts = 0;
      const maxAttempts = 200;

      while (clocksCreated < 100 && attempts < maxAttempts) {
        attempts++;
        const workDate = getRandomPastDate(150);
        const dayOfWeek = workDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        // Skip weekends
        if (dayOfWeek === 'saturday' || dayOfWeek === 'sunday') {
          continue;
        }

        // Standard times (9-5 schedule)
        let arrivalTime = '09:00:00';
        let departureTime = '17:00:00';

        // Determine behavior for this day
        const rand = Math.random();
        
        // Arrival time variations with proper grave lateness
        if (rand < userBehavior.graveLatenessChance) {
          // Grave lateness: beyond the team's lateness limit
          const graveLateMinutes = teamLatenessLimit + Math.floor(Math.random() * 45) + 5;
          arrivalTime = addMinutesToTime(arrivalTime, graveLateMinutes);
        } else if (rand < userBehavior.graveLatenessChance + userBehavior.lateChance) {
          // Warning lateness: within the lateness limit
          const lateMinutes = Math.floor(Math.random() * teamLatenessLimit) + 1;
          arrivalTime = addMinutesToTime(arrivalTime, lateMinutes);
        } else if (rand < userBehavior.graveLatenessChance + userBehavior.lateChance + userBehavior.earlyChance) {
          // Early arrival: more than 5 minutes before
          const earlyMinutes = Math.floor(Math.random() * 25) + 6;
          arrivalTime = addMinutesToTime(arrivalTime, -earlyMinutes);
        }
        // Otherwise: on time (within -5 to 0 minutes)

        // Departure time variations
        const randDepart = Math.random();
        
        if (randDepart < userBehavior.overtimeChance) {
          // Overtime
          const overtimeMinutes = Math.floor(Math.random() * 105) + 15;
          departureTime = addMinutesToTime(departureTime, overtimeMinutes);
        } else if (randDepart < userBehavior.overtimeChance + userBehavior.leaveEarlyChance) {
          // Leave early
          const earlyLeaveMinutes = Math.floor(Math.random() * 45) + 15;
          departureTime = addMinutesToTime(departureTime, -earlyLeaveMinutes);
        }

        // Combine date and time (simple ISO format without timezone conversion)
        const arrivalISO = combineDateAndTime(workDate, arrivalTime);
        const departureISO = combineDateAndTime(workDate, departureTime);

        clockEntries.push({
          user_team_id: primaryUserTeam.id,
          planning_id: primaryUserTeam.planning_id,
          arrival_time: arrivalISO,
          departure_time: departureISO
        });
        
        clocksCreated++;
      }

      // Insert clock entries in batches of 50
      for (let i = 0; i < clockEntries.length; i += 50) {
        const batch = clockEntries.slice(i, i + 50);
        const { error: clockError } = await supabase
          .from('clock')
          .insert(batch);

        if (clockError) {
          console.error(`Error inserting clocks for ${user.first_name}: ${clockError.message}`);
        } else {
          totalClocks += batch.length;
        }
      }

      console.log(`Created ${clockEntries.length} clock entries for ${user.first_name}`);
    }

    console.log(`\nTotal clock entries created: ${totalClocks}\n`);

    // Summary
    console.log('=======================================');
    console.log('SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=======================================');
    console.log(`Teams created: 2`);
    console.log(`   - ${devTeam.name} (ID: ${devTeam.id})`);
    console.log(`   - ${salesTeam.name} (ID: ${salesTeam.id})`);
    console.log(`\nUsers created: ${createdUsers.length}`);
    console.log(`   - Admin users: 2 (Alice Admin, Bob Boss)`);
    console.log(`   - Manager in Dev only: Bob Boss`);
    console.log(`   - Manager in Sales only: Frank Seller`);
    console.log(`   - Manager in both: Alice Admin`);
    console.log(`   - Employees: ${createdUsers.filter(u => u.role === 'employee').length}`);
    console.log(`\nUser-Team associations: ${createdUsers.reduce((sum, u) => sum + u.teams.length, 0)}`);
    console.log(`\nClock entries: ${totalClocks}`);
    console.log(`\nAll passwords: azerty`);
    console.log('=======================================\n');

    // Print sample login credentials
    console.log('SAMPLE LOGIN CREDENTIALS:');
    console.log('=======================================');
    createdUsers.slice(0, 5).forEach(user => {
      console.log(`${user.first_name} ${user.last_name}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: azerty`);
      console.log(`  Permission: ${user.permission}`);
      console.log(`  Teams: ${user.teams.join(', ')}\n`);
    });

  } catch (error) {
    console.error('Error during seeding:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase()
  .then(() => {
    console.log('Seeding process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding process failed:', error);
    process.exit(1);
  });