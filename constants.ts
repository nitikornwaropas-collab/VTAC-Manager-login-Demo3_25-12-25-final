

import { Player, User, UserRole, ScheduleEvent, EventType, RSVPStatus, ChatMessage, ManagerProfile, CoachProfile, ParentProfile, TeamProfile, Team, SportType } from './types';

export const generateMemberId = (name: string): string => {
    const firstName = (name.split(' ')[0] || 'USER').substring(0, 4).toUpperCase();
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // Ensures 6 digits
    return `${firstName}${randomNumber}`;
};

export const MOCK_TEAMS: Team[] = [
    {
        id: 't1',
        name: 'VTAC Demo FC',
        code: 'LOGIN1',
        coachId: 'u2',
        sport: SportType.FOOTBALL,
        ageGroup: 'Senior',
        members: []
    },
    {
        id: 't1_u18',
        name: 'VTAC U18 Elite',
        code: 'ELITE1',
        coachId: 'u2',
        sport: SportType.FOOTBALL,
        ageGroup: 'U18',
        members: []
    },
    {
        id: 't1_b',
        name: 'VTAC Academy B',
        code: 'ACAD02',
        coachId: 'u2',
        sport: SportType.FOOTBALL,
        ageGroup: 'U14',
        members: []
    }
];

export const MOCK_TEAM_PROFILE: TeamProfile = {
    id: 't1',
    name: 'VTAC Raptors',
    logoUrl: 'https://static.thenounproject.com/png/1325323-200.png',
};

export const MOCK_MANAGER_PROFILES: ManagerProfile[] = [
    { id: 'm1', contactPhone: '555-0101', bio: 'Dedicated to fostering talent and teamwork. Let\'s have a great season!', address: '123 Team Way', city: 'Metro City', zip: '12345', yearsExperience: 10 }
];

export const MOCK_COACH_PROFILES: CoachProfile[] = [
    { id: 'c1', specialization: 'Offensive Strategy', certifications: 'UEFA A License', contactPhone: '555-0102', bio: 'Focusing on creative play and technical skill development.', address: '456 Victory Rd', city: 'Metro City', zip: '12345', yearsExperience: 8 },
    { id: 'c2', specialization: 'Defensive Tactics', certifications: 'UEFA B License', contactPhone: '555-0105', bio: 'Building a strong defensive foundation.', address: '789 Defense Ln', city: 'Metro City', zip: '12345', yearsExperience: 5 }
];

export const MOCK_PARENT_PROFILES: ParentProfile[] = [
    // Generated Parents for VTAC Demo FC Players (p1-p12)
    { id: 'pa_p1', contactPhone: '555-0201', emergencyContactName: 'Mark Johnson', emergencyContactPhone: '555-0202', linkedPlayerIds: ['p1'] },
    { id: 'pa_p2', contactPhone: '555-0203', emergencyContactName: 'Giulia Rossi', emergencyContactPhone: '555-0204', linkedPlayerIds: ['p2'] },
    { id: 'pa_p3', contactPhone: '555-0205', emergencyContactName: 'Aisha Adebayo', emergencyContactPhone: '555-0206', linkedPlayerIds: ['p3'] },
    { id: 'pa_p4', contactPhone: '555-0207', emergencyContactName: 'Daniel Kim', emergencyContactPhone: '555-0208', linkedPlayerIds: ['p4'] },
    { id: 'pa_p5', contactPhone: '555-0209', emergencyContactName: 'Elena Garcia', emergencyContactPhone: '555-0210', linkedPlayerIds: ['p5'] },
    { id: 'pa_p6', contactPhone: '555-0211', emergencyContactName: 'Wei Chen', emergencyContactPhone: '555-0212', linkedPlayerIds: ['p6'] },
    { id: 'pa_p7', contactPhone: '555-0213', emergencyContactName: 'Yuki Tanaka', emergencyContactPhone: '555-0214', linkedPlayerIds: ['p7'] },
    { id: 'pa_p8', contactPhone: '555-0215', emergencyContactName: 'Sean O\'Connell', emergencyContactPhone: '555-0216', linkedPlayerIds: ['p8'] },
    { id: 'pa_p9', contactPhone: '555-0217', emergencyContactName: 'Isabella Silva', emergencyContactPhone: '555-0218', linkedPlayerIds: ['p9'] },
    { id: 'pa_p10', contactPhone: '555-0219', emergencyContactName: 'Chidi Okafor', emergencyContactPhone: '555-0220', linkedPlayerIds: ['p10'] },
    { id: 'pa_p11', contactPhone: '555-0221', emergencyContactName: 'Melanie Rashford', emergencyContactPhone: '555-0222', linkedPlayerIds: ['p11'] },
    { id: 'pa_p12', contactPhone: '555-0223', emergencyContactName: 'Jordi Bonmatí', emergencyContactPhone: '555-0224', linkedPlayerIds: ['p12'] },
    { id: 'pa_p13', contactPhone: '555-0225', emergencyContactName: 'David Chen', emergencyContactPhone: '555-0226', linkedPlayerIds: ['p13'] },
    { id: 'pa_p14', contactPhone: '555-0227', emergencyContactName: 'Sarah Wilson', emergencyContactPhone: '555-0228', linkedPlayerIds: ['p14'] },
    { id: 'pa_p15', contactPhone: '555-0229', emergencyContactName: 'Omar Khan', emergencyContactPhone: '555-0230', linkedPlayerIds: ['p15'] },
];

export const MOCK_PLAYERS: Player[] = [
  // --- VTAC Demo FC Players ---
  {
    id: 'p1',
    teamId: 't1',
    name: 'Liam Johnson',
    jerseyNumber: 9,
    position: 'Forward',
    imageUrl: 'https://picsum.photos/seed/liamjohnson/400/400',
    height: "6' 0\"",
    weight: '175 lbs',
    dob: '1998-04-12',
    gameHistory: [],
    notes: "Natural goalscorer with great instincts. Needs to improve his contribution to defensive plays.",
    bio: "Living for the thrill of the game and the roar of the crowd. Every match is a new story.",
    status: 'Active',
  },
  {
    id: 'p2',
    teamId: 't1',
    name: 'Sofia Rossi',
    jerseyNumber: 10,
    position: 'Midfielder',
    imageUrl: 'https://picsum.photos/seed/sofiarossi/400/400',
    height: "5' 6\"",
    weight: '135 lbs',
    dob: '2000-08-25',
    gameHistory: [],
    notes: "Exceptional passer and playmaker. Can work on being more aggressive in taking shots herself.",
    bio: "Connecting the team from the heart of the field. I believe in assists as much as goals.",
    status: 'Active',
  },
  {
    id: 'p3',
    teamId: 't1',
    name: 'Jamal Adebayo',
    jerseyNumber: 4,
    position: 'Defender',
    imageUrl: 'https://picsum.photos/seed/jamaladebayo/400/400',
    height: "6' 2\"",
    weight: '185 lbs',
    dob: '1997-11-30',
    gameHistory: [],
    notes: "A wall in defense, strong in the air. Long-range passing from the back needs refinement.",
    bio: "Defense is an art, and the pitch is my canvas. Nothing gets past me.",
    status: 'Active',
  },
  {
    id: 'p4',
    teamId: 't1',
    name: 'Chloe Kim',
    jerseyNumber: 1,
    position: 'Goalkeeper',
    imageUrl: 'https://picsum.photos/seed/chloekim/400/400',
    height: "5' 9\"",
    weight: '150 lbs',
    dob: '1999-02-18',
    gameHistory: [],
    notes: "Agile and a great shot-stopper. Communication with the defensive line can be more commanding.",
    bio: "Guardian of the net. I thrive on pressure and making the impossible save.",
    status: 'Active',
  },
  {
    id: 'p5',
    teamId: 't1',
    name: 'Mateo Garcia',
    jerseyNumber: 11,
    position: 'Forward',
    imageUrl: 'https://picsum.photos/seed/mateogarcia/400/400',
    height: "5' 10\"",
    weight: '160 lbs',
    dob: '2001-06-05',
    gameHistory: [],
    notes: "Pacy winger with excellent dribbling skills. Final product (crossing/shooting) can be more consistent.",
    bio: "Speed is my weapon. I love taking on defenders and creating chances.",
    status: 'Active',
  },
  {
    id: 'p6',
    teamId: 't1',
    name: 'Isabella Chen',
    jerseyNumber: 8,
    position: 'Midfielder',
    imageUrl: 'https://picsum.photos/seed/isabellachen/400/400',
    height: "5' 7\"",
    weight: '140 lbs',
    dob: '2000-03-22',
    gameHistory: [],
    notes: "High work rate, covers a lot of ground. Decision making in the final third needs improvement.",
    bio: "The engine room of the team. I give my all from the first whistle to the last.",
    status: 'Active',
  },
  {
    id: 'p7',
    teamId: 't1',
    name: 'Kenji Tanaka',
    jerseyNumber: 5,
    position: 'Defender',
    imageUrl: 'https://picsum.photos/seed/kenjitanaka/400/400',
    height: "5' 11\"",
    weight: '170 lbs',
    dob: '1999-09-14',
    gameHistory: [],
    notes: "Intelligent defender, reads the game well. Needs to improve physical strength against bigger forwards.",
    bio: "Playing smart is as important as playing hard. I focus on positioning and anticipation.",
    status: 'Active',
  },
  {
    id: 'p8',
    teamId: 't1',
    name: "Ava O'Connell",
    jerseyNumber: 6,
    position: 'Midfielder',
    imageUrl: 'https://picsum.photos/seed/avaoconnell/400/400',
    height: "5' 8\"",
    weight: '145 lbs',
    dob: '2002-01-10',
    gameHistory: [],
    notes: "Excellent tackler and ball-winner. Needs to work on her passing range under pressure.",
    bio: "Breaking up plays and starting the attack. I enjoy the defensive side of midfield.",
    status: 'Active',
  },
  {
    id: 'p9',
    teamId: 't1',
    name: 'David Silva',
    jerseyNumber: 21,
    position: 'Midfielder',
    imageUrl: 'https://picsum.photos/seed/davidsilva/400/400',
    height: "5' 7\"",
    weight: '148 lbs',
    dob: '1996-01-08',
    gameHistory: [],
    notes: "Creative midfielder, great vision. Needs to improve to track back more consistently.",
    bio: "The ball is my best friend. I love to dictate the tempo of the game.",
    status: 'Active',
  },
  {
    id: 'p10',
    teamId: 't1',
    name: 'Nkechi Okafor',
    jerseyNumber: 2,
    position: 'Defender',
    imageUrl: 'https://picsum.photos/seed/nkechiokafor/400/400',
    height: "5' 10\"",
    weight: '165 lbs',
    dob: '1998-07-21',
    gameHistory: [],
    notes: "Fast and athletic full-back. Decision-making when joining the attack can be improved.",
    bio: "I love the challenge of one-on-one defending and providing width for the team.",
    status: 'Active',
  },
  {
    id: 'p11',
    teamId: 't1',
    name: 'Marcus Rashford',
    jerseyNumber: 10,
    position: 'Forward',
    imageUrl: 'https://picsum.photos/seed/marcusrashford/400/400',
    height: "6' 1\"",
    weight: '170 lbs',
    dob: '1997-10-31',
    gameHistory: [],
    notes: "Incredibly fast with a powerful shot. Can sometimes be inconsistent in front of goal.",
    bio: "Using my speed to make a difference on and off the pitch.",
    status: 'Injured',
  },
  {
    id: 'p12',
    teamId: 't1',
    name: 'Aitana Bonmatí',
    jerseyNumber: 14,
    position: 'Midfielder',
    imageUrl: 'https://picsum.photos/seed/aitanabonmati/400/400',
    height: "5' 4\"",
    weight: '112 lbs',
    dob: '1998-01-18',
    gameHistory: [],
    notes: "Technically gifted, controls the midfield with exceptional vision and passing. Needs to improve her aerial presence.",
    bio: "Football is a game of intelligence. I play with my head and my heart.",
    status: 'Active',
  },
  {
    id: 'p13',
    teamId: 't1',
    name: 'Maya Chen',
    jerseyNumber: 13,
    position: 'Forward',
    imageUrl: 'https://picsum.photos/seed/mayachen/400/400',
    height: "5' 7\"",
    weight: '137 lbs',
    dob: '2005-07-02',
    gameHistory: [],
    notes: "Promising young striker with a lethal finish.",
    bio: "Always forward.",
    status: 'Active',
  },
  {
    id: 'p14',
    teamId: 't1',
    name: 'James Wilson',
    jerseyNumber: 17,
    position: 'Midfielder',
    imageUrl: 'https://picsum.photos/seed/jameswilson/400/400',
    height: "5' 11\"",
    weight: '150 lbs',
    dob: '2004-06-28',
    gameHistory: [],
    notes: "Strong playmaker with good passing range.",
    bio: "Let the ball do the work.",
    status: 'Active',
  },
  {
    id: 'p15',
    teamId: 't1',
    name: 'Samira Khan',
    jerseyNumber: 4,
    position: 'Defender',
    imageUrl: 'https://picsum.photos/seed/samirakhan/400/400',
    height: "6' 0\"",
    weight: '165 lbs',
    dob: '2005-01-08',
    gameHistory: [],
    notes: "A composed defender. Dominant in the air.",
    bio: "Calmness is key.",
    status: 'Active',
  },

  // --- VTAC U18 Elite Players ---
  {
    id: 'p_u18_1',
    teamId: 't1_u18',
    name: 'Jayden Williams',
    jerseyNumber: 7,
    position: 'Forward',
    imageUrl: 'https://picsum.photos/seed/jaydenwilliams/400/400',
    height: "5' 9\"",
    weight: '155 lbs',
    dob: '2006-03-15',
    gameHistory: [],
    notes: "Explosive speed, great prospect for senior squad.",
    bio: "Dreaming big.",
    status: 'Active',
  },
  {
    id: 'p_u18_2',
    teamId: 't1_u18',
    name: 'Ethan Brown',
    jerseyNumber: 4,
    position: 'Defender',
    imageUrl: 'https://picsum.photos/seed/ethanbrown/400/400',
    height: "6' 1\"",
    weight: '170 lbs',
    dob: '2006-07-22',
    gameHistory: [],
    notes: "Solid center back, leadership qualities.",
    bio: "Defense wins championships.",
    status: 'Active',
  },
   {
    id: 'p_u18_3',
    teamId: 't1_u18',
    name: 'Lucas Silva',
    jerseyNumber: 10,
    position: 'Midfielder',
    imageUrl: 'https://picsum.photos/seed/lucassilva/400/400',
    height: "5' 8\"",
    weight: '150 lbs',
    dob: '2007-01-10',
    gameHistory: [],
    notes: "Great vision, needs to improve stamina.",
    bio: "Playmaker.",
    status: 'Active',
  },
  {
    id: 'p_u18_4',
    teamId: 't1_u18',
    name: 'Noah Wilson',
    jerseyNumber: 1,
    position: 'Goalkeeper',
    imageUrl: 'https://picsum.photos/seed/noahwilson/400/400',
    height: "6' 0\"",
    weight: '165 lbs',
    dob: '2006-11-05',
    gameHistory: [],
    notes: "Good reflexes, working on distribution.",
    bio: "Safe hands.",
    status: 'Active',
  }
  // VTAC Academy B has NO players by default to test adding players.
];

// Reference array for players that need specific logins
const vtacDemoFcPlayerIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15'];

export const MOCK_USERS: User[] = [
    // Staff
    { id: 'u1', name: 'Maria Garcia', email: 'manager@vtac.com', role: UserRole.Manager, managerId: 'm1', status: 'active', teamId: 't1', imageUrl: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=6D28D9&color=fff', password: 'password', memberId: generateMemberId('Maria Garcia') },
    { id: 'u2', name: 'David Chen', email: 'coach@vtac.com', role: UserRole.Coach, coachId: 'c1', status: 'active', teamId: 't1', imageUrl: 'https://ui-avatars.com/api/?name=David+Chen&background=0D8ABC&color=fff', password: 'password', memberId: generateMemberId('David Chen') },
    { id: 'u6', name: 'Mike Lee', email: 'assistant@vtac.com', role: UserRole.AssistantCoach, coachId: 'c2', status: 'active', teamId: 't1', imageUrl: 'https://ui-avatars.com/api/?name=Mike+Lee&background=random', memberId: generateMemberId('Mike Lee') },
    { id: 'u5', name: 'Pending User', email: 'newbie@vtac.com', role: UserRole.Player, status: 'pending', teamId: 't1', imageUrl: 'https://ui-avatars.com/api/?name=Pending+User&background=random', memberId: generateMemberId('Pending User') },
    
    // Players (with updated emails for p1-p12)
    ...MOCK_PLAYERS.map((player, index) => {
      const isDemoFcPlayer = vtacDemoFcPlayerIds.includes(player.id);
      const playerIndex = vtacDemoFcPlayerIds.indexOf(player.id);
      
      return {
        id: `u_${player.id}`,
        name: player.name,
        email: isDemoFcPlayer ? `player${playerIndex + 1}@vtac.com` : `${player.name.split(' ')[0].toLowerCase()}@vtac.com`,
        role: UserRole.Player,
        status: 'active' as 'active' | 'pending',
        imageUrl: player.imageUrl,
        playerId: player.id,
        teamId: player.teamId,
        password: 'password', // For demo purposes
        memberId: generateMemberId(player.name),
      };
    }),

    // Generated Parents for players p1-p12
    { id: 'u_parent_p1', name: 'Sarah Johnson', email: 'parent1@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p1', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random', memberId: generateMemberId('Sarah Johnson') },
    { id: 'u_parent_p2', name: 'Marco Rossi', email: 'parent2@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p2', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Marco+Rossi&background=random', memberId: generateMemberId('Marco Rossi') },
    { id: 'u_parent_p3', name: 'David Adebayo', email: 'parent3@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p3', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=David+Adebayo&background=random', memberId: generateMemberId('David Adebayo') },
    { id: 'u_parent_p4', name: 'Min-jun Kim', email: 'parent4@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p4', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Min-jun+Kim&background=random', memberId: generateMemberId('Min-jun Kim') },
    { id: 'u_parent_p5', name: 'Isabella Garcia', email: 'parent5@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p5', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Isabella+Garcia&background=random', memberId: generateMemberId('Isabella Garcia') },
    { id: 'u_parent_p6', name: 'Li Chen', email: 'parent6@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p6', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Li+Chen&background=random', memberId: generateMemberId('Li Chen') },
    { id: 'u_parent_p7', name: 'Akira Tanaka', email: 'parent7@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p7', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Akira+Tanaka&background=random', memberId: generateMemberId('Akira Tanaka') },
    { id: 'u_parent_p8', name: 'Fiona O\'Connell', email: 'parent8@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p8', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Fiona+OConnell&background=random', memberId: generateMemberId('Fiona O\'Connell') },
    { id: 'u_parent_p9', name: 'Rafael Silva', email: 'parent9@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p9', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Rafael+Silva&background=random', memberId: generateMemberId('Rafael Silva') },
    { id: 'u_parent_p10', name: 'Ayo Okafor', email: 'parent10@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p10', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Ayo+Okafor&background=random', memberId: generateMemberId('Ayo Okafor') },
    { id: 'u_parent_p11', name: 'Daniel Rashford', email: 'parent11@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p11', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Daniel+Rashford&background=random', memberId: generateMemberId('Daniel Rashford') },
    { id: 'u_parent_p12', name: 'Vicent Bonmatí', email: 'parent12@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p12', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Vicent+Bonmatí&background=random', memberId: generateMemberId('Vicent Bonmatí') },
    { id: 'u_parent_p13', name: 'Robert Chen', email: 'parent13@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p13', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Robert+Chen&background=random', memberId: generateMemberId('Robert Chen') },
    { id: 'u_parent_p14', name: 'Laura Wilson', email: 'parent14@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p14', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Laura+Wilson&background=random', memberId: generateMemberId('Laura Wilson') },
    { id: 'u_parent_p15', name: 'Ali Khan', email: 'parent15@vtac.com', role: UserRole.Parent, status: 'active', parentId: 'pa_p15', teamId: 't1', password: 'password', imageUrl: 'https://ui-avatars.com/api/?name=Ali+Khan&background=random', memberId: generateMemberId('Ali Khan') },
];


export const MOCK_EVENTS: ScheduleEvent[] = [
  {
    id: 'event1',
    teamId: 't1',
    type: EventType.HomeGame,
    title: 'League Match',
    date: '2024-08-05',
    time: '18:00',
    location: 'City Stadium',
    opponent: 'FC Raptors',
    notes: 'Arrive 45 minutes early for warm-up.',
    rsvps: [],
    attendedPlayerIds: ['p1', 'p2', 'p5', 'p7', 'p8'],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
  {
    id: 'event2',
    teamId: 't1',
    type: EventType.Training,
    title: 'Defensive Drill Session',
    date: '2024-08-07',
    time: '19:30',
    location: 'Training Ground West',
    notes: 'Focus on defensive drills. Bring water and both kits.',
    rsvps: [],
    attendedPlayerIds: [],
    updatedAt: new Date().toISOString(), // recent update
  },
    {
    id: 'event3',
    teamId: 't1',
    type: EventType.Meeting,
    title: 'Quarterly Strategy',
    date: '2024-08-10',
    time: '10:00',
    location: 'Local Park Pitch 3',
    notes: 'Team meeting to discuss upcoming strategy.',
    rsvps: [],
    attendedPlayerIds: [],
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  // U18 Event
  {
    id: 'event_u18_1',
    teamId: 't1_u18',
    type: EventType.Training,
    title: 'U18 Selection',
    date: '2024-08-12',
    time: '17:00',
    location: 'Academy Pitch 1',
    notes: 'Selection trials.',
    rsvps: [],
    attendedPlayerIds: [],
    updatedAt: new Date().toISOString(),
  }
].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const MOCK_MESSAGES: ChatMessage[] = [
    {
        id: 'msg1',
        teamId: 't1',
        userId: 'u2', // Coach David Chen
        userName: 'David Chen',
        userAvatarUrl: 'https://ui-avatars.com/api/?name=David+Chen&background=0D8ABC&color=fff',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        content: "Hi team, quick reminder that tomorrow's training will focus on defensive drills. Please come prepared!",
        reactions: []
    },
    {
        id: 'msg2',
        teamId: 't1',
        userId: 'u1', // Manager Maria Garcia
        userName: 'Maria Garcia',
        userAvatarUrl: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=6D28D9&color=fff',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        content: "Thanks, Coach! Also, everyone please make sure your RSVPs for the weekend game are updated by tonight.",
        reactions: []
    },
    {
        id: 'msg3',
        teamId: 't1',
        userId: 'u_p1', // Player Liam Johnson
        userName: 'Liam Johnson',
        userAvatarUrl: 'https://picsum.photos/seed/liamjohnson/400/400',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        content: "Got it. I'm confirmed for the game.",
        reactions: []
    },
];