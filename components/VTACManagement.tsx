import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Team, Player, ScheduleEvent, ChatMessage, 
  LiveGameState, View, EventType, RSVPStatus, 
  GameEventType, GameEvent, UserRole, TeamProfile,
  ManagerProfile, CoachProfile, ParentProfile, GameStats
} from '../types';

import PlayerList from './PlayerList';
import PlayerCV from './PlayerCV';
import ScheduleView from './ScheduleView';
import CommunicationView from './CommunicationView';
import LiveGameView from './LiveGameView';
import PlayerManagementView from './PlayerManagementView';
import ProfileView from './ProfileView';
import ParentDashboard from './ParentDashboard';
import InviteUserModal from './InviteUserModal';
import { ClipboardIcon } from './icons';

interface VTACManagementProps {
  user: User;
  team: Team;
  availableTeams: Team[];
  
  // Global Data passed from App.tsx
  players: Player[];
  allUsers: User[];
  events: ScheduleEvent[];
  messages: ChatMessage[];
  liveGameState: LiveGameState | null;
  teamProfile: TeamProfile;
  managerProfiles: ManagerProfile[];
  coachProfiles: CoachProfile[];
  parentProfiles: ParentProfile[];

  // Updaters
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setEvents: React.Dispatch<React.SetStateAction<ScheduleEvent[]>>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setLiveGameState: React.Dispatch<React.SetStateAction<LiveGameState | null>>;
  setTeamProfile: React.Dispatch<React.SetStateAction<TeamProfile>>;
  setManagerProfiles: React.Dispatch<React.SetStateAction<ManagerProfile[]>>;
  setCoachProfiles: React.Dispatch<React.SetStateAction<CoachProfile[]>>;
  setParentProfiles: React.Dispatch<React.SetStateAction<ParentProfile[]>>;
  
  // User Updater
  onUpdateUser: (updates: Partial<User>) => void;
  
  // Team Handlers
  onCreateTeam: (teamData: Partial<Team>) => void;
  onUpdateTeam: (teamId: string, updates: Partial<Team>) => void;
  onSwitchTeam: (teamId: string) => void;

  // View State
  currentView: View;
  onViewChange: (view: View) => void;
}

const VTACManagement: React.FC<VTACManagementProps> = ({ 
    user: currentUser, 
    team,
    availableTeams,
    players, allUsers, events, messages, liveGameState, teamProfile,
    managerProfiles, coachProfiles, parentProfiles,
    setPlayers, setEvents, setMessages, setLiveGameState,
    setTeamProfile, setManagerProfiles, setCoachProfiles, setParentProfiles,
    onUpdateUser,
    onCreateTeam,
    onUpdateTeam,
    onSwitchTeam,
    currentView,
    onViewChange
}) => {
  // --- STATE ---
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [linkedPlayers, setLinkedPlayers] = useState<Player[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // --- FILTERED DATA BASED ON ACTIVE TEAM ---
  const teamPlayers = useMemo(() => players.filter(p => p.teamId === team.id), [players, team.id]);
  const teamEvents = useMemo(() => events.filter(e => e.teamId === team.id), [events, team.id]);
  const teamMessages = useMemo(() => messages.filter(m => m.teamId === team.id), [messages, team.id]);

  // --- INITIALIZATION ---
  useEffect(() => {
      // Initialize linked players for parents
      if (currentUser.role === UserRole.Parent && currentUser.parentId) {
          const profile = parentProfiles.find(p => p.id === currentUser.parentId);
          if (profile) {
              const children = players.filter(p => profile.linkedPlayerIds.includes(p.id) && p.teamId === team.id);
              setLinkedPlayers(children);
          }
      }
  }, [currentUser, parentProfiles, players, team.id]);

  const upcomingGame = useMemo(() => {
    return teamEvents
        .filter(e => e.type === EventType.Game || e.type === EventType.HomeGame || e.type === EventType.AwayGame)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .find(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));
  }, [teamEvents]);

  // Auto-init live game state if entering live view and no state exists
  useEffect(() => {
    if (currentView === 'live' && upcomingGame) {
      if (!liveGameState || liveGameState.eventId !== upcomingGame.id) {
        setLiveGameState({
          eventId: upcomingGame.id,
          isLive: false,
          homeScore: 0,
          awayScore: 0,
          events: [],
          gameNotes: '',
          opponentLogoUrl: '',
        });
      }
    }
  }, [currentView, upcomingGame, liveGameState, setLiveGameState]);

  // --- HANDLERS ---

  const handleInviteUser = (email: string, role: UserRole) => {
      // Create a mock pending player on the fly for demo purposes
      const newMockPlayer: Player = {
          id: `p_mock_${Date.now()}`,
          teamId: team.id,
          name: email.split('@')[0], // Use email username as temp name
          jerseyNumber: 0,
          position: 'Unknown',
          imageUrl: 'https://ui-avatars.com/api/?name=' + email + '&background=random',
          height: '-',
          weight: '-',
          dob: new Date().toISOString(),
          gameHistory: [],
          status: 'Pending'
      };
      
      setPlayers(prev => [...prev, newMockPlayer]);
  };

  const handleSaveProfile = (
    userData: Partial<User>, 
    playerData: Partial<Player> | null,
    managerData: Partial<ManagerProfile> | null,
    coachData: Partial<CoachProfile> | null,
    parentData: Partial<ParentProfile> | null,
    teamData: Partial<TeamProfile> | null
  ) => {
    // Update Global User State
    if (Object.keys(userData).length > 0) onUpdateUser(userData);

    if (teamData) {
        setTeamProfile(prev => ({ ...prev, ...teamData }));
        // Ensure global team data is also updated
        onUpdateTeam(team.id, { name: teamData.name, logoUrl: teamData.logoUrl });
    }

    if (playerData) {
        let targetPlayerId = currentUser.playerId;

        // Defensive Check: If User doesn't have a playerId (legacy/bug), try to find the player by name
        if (!targetPlayerId && currentUser.role === UserRole.Player) {
            const foundPlayer = players.find(p => p.name === currentUser.name);
            if (foundPlayer) {
                targetPlayerId = foundPlayer.id;
                // Fix the broken link on the user object as well
                onUpdateUser({ playerId: targetPlayerId });
            }
        }

        if (targetPlayerId) {
            setPlayers(prev => prev.map(p => p.id === targetPlayerId ? { ...p, ...playerData } : p));
        }
    }
    
    if (managerData && currentUser.managerId) {
        setManagerProfiles(prev => prev.map(p => p.id === currentUser.managerId ? { ...p, ...managerData } : p));
    }
    if (coachData && currentUser.coachId) {
        setCoachProfiles(prev => prev.map(p => p.id === currentUser.coachId ? { ...p, ...coachData } : p));
    }
    if (parentData && currentUser.parentId) {
        setParentProfiles(prev => prev.map(p => p.id === currentUser.parentId ? { ...p, ...parentData } : p));
    }
  };

  const handleAddStats = (playerId: string, newStats: GameStats) => {
      setPlayers(prev => {
          const updated = prev.map(p => p.id === playerId ? { ...p, gameHistory: [...p.gameHistory, newStats] } : p);
          // Also update selected player view
          if (selectedPlayer?.id === playerId) {
              const updatedPlayer = updated.find(p => p.id === playerId);
              if (updatedPlayer) setSelectedPlayer(updatedPlayer);
          }
          return updated;
      });
  };

  const handleUpdatePlayerNotes = (playerId: string, notes: string) => {
      setPlayers(prev => {
          const updated = prev.map(p => p.id === playerId ? { ...p, notes } : p);
          if (selectedPlayer?.id === playerId) {
              const updatedPlayer = updated.find(p => p.id === playerId);
              if (updatedPlayer) setSelectedPlayer(updatedPlayer);
          }
          return updated;
      });
  };

  const handleAddEvent = (newEventData: Omit<ScheduleEvent, 'id' | 'rsvps' | 'attendedPlayerIds' | 'updatedAt' | 'teamId'>) => {
      const newEvent: ScheduleEvent = {
          ...newEventData,
          id: `evt_${Date.now()}`,
          teamId: team.id, // Ensure event is added to current team
          rsvps: teamPlayers.map(p => ({ playerId: p.id, status: RSVPStatus.Pending })),
          attendedPlayerIds: [],
          updatedAt: new Date().toISOString()
      };
      setEvents(prev => [...prev, newEvent]);
  };

  const handleUpdateEvent = (updatedEvent: ScheduleEvent) => {
      setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const handleUpdateRSVP = (eventId: string, playerId: string, status: RSVPStatus) => {
      setEvents(prev => prev.map(e => {
          if (e.id !== eventId) return e;
          const updatedRsvps = e.rsvps.map(r => r.playerId === playerId ? { ...r, status } : r);
          if (!e.rsvps.find(r => r.playerId === playerId)) {
             updatedRsvps.push({ playerId, status });
          }
          return { ...e, rsvps: updatedRsvps };
      }));
  };

  const handleUpdateAttendance = (eventId: string, playerId: string, isAttending: boolean) => {
      setEvents(prev => prev.map(e => {
          if (e.id !== eventId) return e;
          const attendedIds = new Set(e.attendedPlayerIds);
          if (isAttending) attendedIds.add(playerId);
          else attendedIds.delete(playerId);
          return { ...e, attendedPlayerIds: Array.from(attendedIds) };
      }));
  };

  const handleSendMessage = (content: string, imageUrl?: string) => {
      const newMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          teamId: team.id, // Ensure message is sent to current team
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatarUrl: currentUser.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`,
          timestamp: new Date().toISOString(),
          content,
          imageUrl,
          reactions: []
      };
      setMessages(prev => [...prev, newMsg]);
  };

  const handleReaction = (messageId: string, emoji: string) => {
      setMessages(prev => prev.map(msg => {
          if (msg.id !== messageId) return msg;
          const existingReaction = msg.reactions?.find(r => r.userId === currentUser.id && r.emoji === emoji);
          let newReactions = msg.reactions || [];
          if (existingReaction) {
              newReactions = newReactions.filter(r => !(r.userId === currentUser.id && r.emoji === emoji));
          } else {
              newReactions = [...newReactions, { userId: currentUser.id, emoji }];
          }
          return { ...msg, reactions: newReactions };
      }));
  };

  // --- AUTOMATIC STATS SYNC ---
  const saveGameStatsToPlayers = () => {
      if (!liveGameState) return;

      // Find the event linked to this game
      const gameEvent = teamEvents.find(e => e.id === liveGameState.eventId);
      if (!gameEvent) return;

      const gameId = gameEvent.id;
      const date = gameEvent.date;
      const opponent = gameEvent.opponent || 'Unknown';
      
      const home = liveGameState.homeScore;
      const away = liveGameState.awayScore;
      let result = 'D';
      if (home > away) result = 'W';
      else if (home < away) result = 'L';
      
      const scoreString = `${home}-${away} ${result}`;
      const isCleanSheet = away === 0; // Assuming we are 'home'

      setPlayers(prevPlayers => prevPlayers.map(player => {
          // Only update players in current team
          if (player.teamId !== team.id) return player;

          // Calculate stats from live events
          const playerEvents = liveGameState.events.filter(e => 
              e.playerId === player.id || e.secondaryPlayerId === player.id || e.cornerByPlayerId === player.id
          );

          const attended = gameEvent.attendedPlayerIds.includes(player.id);
          // Player participated if they are marked attended OR generated an event
          const played = attended || playerEvents.length > 0;
          
          if (!played) return player;

          let goals = 0;
          let assists = 0;
          let fouls = 0;
          let saves = 0;
          let redCards = 0;
          let penalties = 0;
          
          playerEvents.forEach(e => {
              if (e.playerId === player.id) {
                  if (e.type === GameEventType.Goal) goals++;
                  if (e.type === GameEventType.Penalty) { goals++; penalties++; }
                  if (e.type === GameEventType.Foul) fouls++;
                  if (e.type === GameEventType.RedCard) redCards++;
                  if (e.type === GameEventType.Save) saves++;
              }
              if (e.secondaryPlayerId === player.id) {
                  if (e.type === GameEventType.Goal) assists++;
              }
          });

          const position = player.position.toLowerCase();
          const isDefensive = position.includes('keeper') || position.includes('defender') || position.includes('cb') || position.includes('lb') || position.includes('rb') || position.includes('gk');
          const cleanSheet = isCleanSheet && isDefensive;

          const newStat: GameStats = {
              id: `gs_${gameId}_${player.id}`,
              date: date,
              opponent: opponent,
              score: scoreString,
              minutesPlayed: 90, // Default to full game for MVP
              goals,
              assists,
              tackles: 0, // Not tracked in live
              fouls,
              saves,
              playerOfTheMatch: false,
              substitutions: 0,
              cleanSheet,
              penaltiesScored: penalties,
              redCards
          };

          // Prevent duplicate stats if game is toggled live multiple times
          const existingIndex = player.gameHistory.findIndex(h => h.id === newStat.id);
          
          if (existingIndex >= 0) {
              const updatedHistory = [...player.gameHistory];
              updatedHistory[existingIndex] = newStat;
              return { ...player, gameHistory: updatedHistory };
          }

          // Add new stats to history (newest first)
          return {
              ...player,
              gameHistory: [...player.gameHistory, newStat]
          };
      }));
      
      alert("Match finished! Stats have been synced to player profiles.");
  };

  const handleUpdateLiveGame = (updatedState: Partial<LiveGameState>) => {
      // If game is transitioning from Live to Not Live (Finished), save stats
      if (liveGameState?.isLive && updatedState.isLive === false) {
          saveGameStatsToPlayers();
      }
      setLiveGameState(prev => prev ? { ...prev, ...updatedState } : null);
  };

  const handleAddLiveGameEvent = (newEvent: Omit<GameEvent, 'id'>) => {
      if (!liveGameState) return;
      const event: GameEvent = { ...newEvent, id: `lge_${Date.now()}` };
      setLiveGameState(prev => prev ? { ...prev, events: [event, ...prev.events] } : null);
  };

  const handleUpdatePlayerStatus = (playerId: string, status: 'Active' | 'Injured' | 'Suspended' | 'Unavailable' | 'Pending') => {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, status } : p));
  };

  const handleDeletePlayer = (playerId: string) => {
      if (window.confirm('Delete player?')) {
          setPlayers(prev => prev.filter(p => p.id !== playerId));
      }
  };

  // --- RENDER HELPERS ---

  const NavButton: React.FC<{view: View, label: string}> = ({ view, label }) => (
      <button
        onClick={() => {
          onViewChange(view);
          setSelectedPlayer(null);
        }}
        className={`px-3 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-semibold rounded-lg transition-all duration-300 relative overflow-hidden whitespace-nowrap flex-shrink-0 ${
          currentView === view && !selectedPlayer
            ? 'text-white shadow-lg shadow-blue-500/25'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {currentView === view && !selectedPlayer && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-100 z-0"></div>
        )}
        <span className="relative z-10">{label}</span>
      </button>
  );

  const getProfileData = () => {
      return {
          playerProfile: teamPlayers.find(p => p.id === currentUser.playerId),
          managerProfile: managerProfiles.find(p => p.id === currentUser.managerId),
          coachProfile: coachProfiles.find(p => p.id === currentUser.coachId),
          parentProfile: parentProfiles.find(p => p.id === currentUser.parentId),
      };
  };

  const renderRosterView = () => {
    if (selectedPlayer) {
      // Logic to check if the current user is viewing their own profile
      // Must be a player role AND their linked playerId must match the selected profile id
      const isOwnProfile = currentUser.role === UserRole.Player && currentUser.playerId === selectedPlayer.id;

      return (
        <PlayerCV
          player={selectedPlayer}
          onBack={() => setSelectedPlayer(null)}
          currentUserRole={currentUser.role}
          onAddStats={handleAddStats}
          onUpdatePlayerNotes={handleUpdatePlayerNotes}
          teamProfile={teamProfile}
          isOwnProfile={isOwnProfile}
        />
      );
    }

    if (currentUser.role === UserRole.Parent) {
      return (
        <ParentDashboard
          players={linkedPlayers}
          onSelectPlayer={setSelectedPlayer}
          teamProfile={teamProfile}
        />
      );
    }
    
    return (
      <PlayerList
        players={teamPlayers}
        onSelectPlayer={setSelectedPlayer}
        currentUserRole={currentUser.role}
        onInviteUser={(email, role) => {
             console.log(`Inviting ${email} as ${role}`);
             setIsInviteModalOpen(true); // Allow direct invite from roster too if needed
        }}
        teamProfile={teamProfile}
        availableTeams={availableTeams}
        currentTeamId={team.id}
        onSwitchTeam={onSwitchTeam}
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] text-text-primary font-sans animate-fade-in">
      {/* Header - Redesigned to remove empty space and look "cool" */}
      <header className="relative z-20 bg-[#13161F] border-b border-white/5 sticky top-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />
        
        <div className="relative px-4 py-4 md:px-6 md:py-5 flex flex-col md:flex-row items-end justify-between gap-4">
           
           {/* Left Section: Title & Nav Consolidated */}
           <div className="flex flex-col gap-3 w-full md:w-auto overflow-hidden">
              {/* Title moved down just above tabs */}
              <div className="flex items-center gap-3 pl-1">
                  <div className="w-1.5 h-6 md:h-8 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <h1 className="text-lg md:text-2xl font-bold tracking-[0.15em] text-blue-300 uppercase truncate">
                     VTAC Management Suite
                  </h1>
              </div>
              
              {/* Tabs Container - Improved for mobile */}
              <div 
                className="flex items-center space-x-1 bg-[#0B0F19] p-1.5 rounded-xl border border-white/10 shadow-inner overflow-x-auto w-full md:w-auto no-scrollbar touch-pan-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                 <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                      display: none;
                    }
                 `}</style>
                 <NavButton view="roster" label={currentUser.role === UserRole.Parent ? "My Players" : "Roster"} />
                 {(currentUser.role === UserRole.Manager || currentUser.role === UserRole.Coach) && (
                     <NavButton view="management" label="Management" />
                 )}
                 <NavButton view="schedule" label="Schedule" />
                 <NavButton view="live" label="Live Game" />
                 <NavButton view="chat" label="Team Chat" />
              </div>
           </div>

           {/* Profile Section */}
           <div className="flex items-center space-x-4 pb-1 w-full md:w-auto justify-end">
                <button
                   onClick={() => {
                       onViewChange('profile');
                       setSelectedPlayer(null);
                   }}
                   className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full hover:bg-white/5 transition-all group border border-transparent hover:border-white/10"
                   aria-label="Edit user profile"
               >
                   <div className="text-right hidden md:block group-hover:text-white transition-colors">
                       <p className="font-bold text-xl text-white">{currentUser.name}</p>
                       <p className="text-sm text-slate-400 uppercase tracking-wider">{currentUser.role}</p>
                   </div>
                   <div className="w-12 h-12 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-lg group-hover:border-blue-500/50 transition-colors relative">
                        <img 
                           src={currentUser.imageUrl || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`} 
                           alt={currentUser.name}
                           className="w-full h-full object-cover"
                       />
                   </div>
               </button>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-6 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {currentView === 'roster' && renderRosterView()}
        
        {currentView === 'management' && (
             <PlayerManagementView
                players={teamPlayers}
                allUsers={allUsers}
                events={teamEvents}
                currentUserRole={currentUser.role}
                onAddPlayer={() => setIsInviteModalOpen(true)}
                onUpdatePlayerStatus={handleUpdatePlayerStatus}
                onDeletePlayer={handleDeletePlayer}
             />
        )}
        
        {currentView === 'schedule' && (
            <ScheduleView
                events={teamEvents}
                players={teamPlayers}
                currentUser={currentUser}
                parentProfile={getProfileData().parentProfile}
                onAddEvent={handleAddEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                onUpdateRSVP={handleUpdateRSVP}
                onUpdateAttendance={handleUpdateAttendance}
                teamProfile={teamProfile}
            />
        )}
        
        {currentView === 'chat' && (
            <CommunicationView
                messages={teamMessages}
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                onReactToMessage={handleReaction}
                teamProfile={teamProfile}
            />
        )}
        
        {currentView === 'live' && (
            <LiveGameView 
                liveGame={liveGameState}
                currentEvent={upcomingGame || null}
                teamProfile={teamProfile}
                players={teamPlayers}
                currentUser={currentUser}
                onUpdateLiveGame={handleUpdateLiveGame}
                onAddLiveGameEvent={handleAddLiveGameEvent}
            />
        )}
        
        {currentView === 'profile' && (
            <ProfileView 
                currentUser={currentUser}
                {...getProfileData()}
                teamProfile={teamProfile}
                players={teamPlayers}
                allUsers={allUsers}
                onSaveProfile={handleSaveProfile}
                onBack={() => onViewChange('roster')}
                // New Team Management Props
                availableTeams={availableTeams}
                onCreateTeam={onCreateTeam}
                onUpdateTeam={onUpdateTeam}
            />
        )}
      </main>
      
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteUser}
        teamName={team.name}
        teamCode={team.code}
      />
    </div>
  );
};

export default VTACManagement;