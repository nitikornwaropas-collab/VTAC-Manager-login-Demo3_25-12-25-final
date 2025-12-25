
/**
 * GLOBAL TYPES FOR VTAC SUITE
 */

export enum UserRole {
  Manager = 'Manager',
  Coach = 'Coach',
  AssistantCoach = 'Assistant Coach',
  Player = 'Player',
  Parent = 'Parent',
  Unassigned = 'Unassigned' // Support for initial auth state
}

export enum SportType {
  FOOTBALL = 'Football',
  BASKETBALL = 'Basketball',
  HOCKEY = 'Hockey'
}

export interface User {
  id: string;
  uid?: string; // Legacy support
  name: string;
  fullName?: string; // Legacy support
  email: string;
  password?: string;
  role: UserRole;
  status: 'active' | 'pending';
  imageUrl?: string;
  photoUrl?: string; // Legacy support
  sportType?: SportType;
  teamId?: string | null;
  playerId?: string;
  managerId?: string;
  coachId?: string;
  parentId?: string;
  memberId?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  coachId: string;
  sport: SportType;
  ageGroup: string;
  members: string[];
  logoUrl?: string;
}

// --- TACTICAL BOARD TYPES ---
export interface TacticObject {
  id: string;
  type: 'player' | 'ball' | 'cone';
  x: number;
  y: number;
  label?: string;
  color?: string;
  teamId?: string;
}

export interface Drill {
  id: string;
  title: string;
  description: string;
  objects: TacticObject[];
}

// --- VTAC MANAGEMENT MODULE TYPES ---

export type View = 'roster' | 'management' | 'schedule' | 'live' | 'chat' | 'profile';

// Profiles
export interface TeamProfile {
    id: string;
    name: string;
    logoUrl: string;
}

export interface ManagerProfile {
    id: string;
    contactPhone: string;
    bio?: string;
    address?: string;
    city?: string;
    zip?: string;
    yearsExperience?: number;
}

export interface CoachProfile {
    id: string;
    specialization: string;
    certifications: string;
    contactPhone: string;
    bio?: string;
    address?: string;
    city?: string;
    zip?: string;
    yearsExperience?: number;
}

export interface ParentProfile {
    id: string;
    contactPhone: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    linkedPlayerIds: string[];
}

// Game Stats
export interface GameStats {
  id: string;
  date: string;
  opponent: string;
  score: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  tackles: number;
  fouls: number;
  saves: number;
  playerOfTheMatch: boolean;
  substitutions?: number;
  cleanSheet?: boolean;
  penaltiesScored?: number;
  redCards?: number;
}

export interface Player {
  id: string;
  teamId: string; // Link to specific team
  name: string;
  jerseyNumber: number;
  position: string;
  imageUrl: string;
  height: string;
  weight: string;
  dob: string;
  gameHistory: GameStats[];
  notes?: string;
  bio?: string;
  status?: 'Active' | 'Injured' | 'Suspended' | 'Unavailable' | 'Pending';
}

// Schedule
export enum EventType {
  Game = 'Game',
  HomeGame = 'Home Game',
  AwayGame = 'Away Game',
  Training = 'Training',
  Meeting = 'Meeting',
}

export enum RSVPStatus {
  Going = 'Going',
  NotGoing = 'Not Going',
  Maybe = 'Maybe',
  Pending = 'Pending',
}

export interface RSVP {
  playerId: string;
  status: RSVPStatus;
}

export interface ScheduleEvent {
  id: string;
  teamId: string; // Link to specific team
  type: EventType;
  title?: string;
  date: string; // ISO string
  time: string;
  location: string;
  opponent?: string;
  notes?: string;
  rsvps: RSVP[];
  attendedPlayerIds: string[];
  updatedAt?: string;
}

// Communication
export interface Reaction {
    userId: string;
    emoji: string;
}

export interface ChatMessage {
  id: string;
  teamId: string; // Link to specific team
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  reactions?: Reaction[];
}

// Live Game
export enum GameEventType {
  Goal = 'Goal',
  OwnGoal = 'Own Goal',
  Foul = 'Foul',
  YellowCard = 'Yellow Card',
  RedCard = 'Red Card',
  SubstitutionOn = 'Substitution On',
  SubstitutionOff = 'Substitution Off',
  Save = 'Save',
  Penalty = 'Penalty',
  Whistle = 'Whistle' // Legacy support
}

export interface GameEvent {
  id: string;
  type: GameEventType;
  minute: number;
  playerId: string;
  secondaryPlayerId?: string;
  team: 'home' | 'away';
  details?: string;
  cornerByPlayerId?: string;
}

export interface LiveGameState {
  eventId: string;
  isLive: boolean;
  homeScore: number;
  awayScore: number;
  events: GameEvent[];
  gameNotes?: string;
  opponentLogoUrl?: string;
  timer?: number;
  homeFormation?: string;
  awayFormation?: string;
}
