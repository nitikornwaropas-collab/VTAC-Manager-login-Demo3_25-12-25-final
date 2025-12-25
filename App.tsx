
import React, { useState, useEffect } from 'react';
import AuthFlow from './components/AuthFlow';
import VTACManagement from './components/VTACManagement';
import MembersView from './components/MembersView'; // Import the new component
import TacticalBoard from './components/TacticalBoard';
import { generateDrillSuggestion, generateTrainingPlan } from './services/geminiService';
import { User, Team, UserRole, Player, ScheduleEvent, ChatMessage, LiveGameState, ManagerProfile, CoachProfile, ParentProfile, TeamProfile, SportType, EventType, View, TacticObject } from './types';
import { 
  MOCK_PLAYERS, MOCK_EVENTS, MOCK_MESSAGES, 
  MOCK_TEAM_PROFILE, MOCK_MANAGER_PROFILES,
  MOCK_COACH_PROFILES, MOCK_PARENT_PROFILES,
  MOCK_TEAMS, MOCK_USERS
} from './constants';

const App: React.FC = () => {
  // --- GLOBAL STATE (PERSISTENT DATA) ---
  // We lift state here so it persists when users log in/out
  const [players, setPlayers] = useState<Player[]>(MOCK_PLAYERS);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [events, setEvents] = useState<ScheduleEvent[]>(MOCK_EVENTS);
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [liveGameState, setLiveGameState] = useState<LiveGameState | null>(null);
  const [tacticalObjects, setTacticalObjects] = useState<TacticObject[]>([]);
  
  // TEAMS STATE (PERSISTENT) - Source of truth for all users
  // This ensures updates (like logo changes) by a Manager persist when a Player logs in.
  const [globalTeams, setGlobalTeams] = useState<Team[]>(MOCK_TEAMS);
  
  // Profiles State
  const [teamProfile, setTeamProfile] = useState<TeamProfile>(MOCK_TEAM_PROFILE);
  const [managerProfiles, setManagerProfiles] = useState<ManagerProfile[]>(MOCK_MANAGER_PROFILES);
  const [coachProfiles, setCoachProfiles] = useState<CoachProfile[]>(MOCK_COACH_PROFILES);
  const [parentProfiles, setParentProfiles] = useState<ParentProfile[]>(MOCK_PARENT_PROFILES);

  // --- USER SESSION STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vtac' | 'tactics' | 'interactive' | 'settings' | 'members'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [managementView, setManagementView] = useState<View>('roster');
  
  // --- MODULE STATE ---
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Player Training Plan State
  const [tpPosition, setTpPosition] = useState('Striker');
  const [tpExperience, setTpExperience] = useState('Intermediate');
  const [tpGoals, setTpGoals] = useState('');
  
  const handleAuthComplete = (usr: User, tm: Team) => {
    const userWithContext = { ...usr, teamId: tm.id };

    // TEAM CONTEXT SETUP
    if (usr.role === UserRole.Coach || usr.role === UserRole.Manager) {
        const teamsWithLogos = globalTeams.map(t => ({...t, logoUrl: t.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random&length=2&bold=true`}));
        setGlobalTeams(teamsWithLogos);
        setAvailableTeams(teamsWithLogos);
        const initialTeam = teamsWithLogos.find(t => t.id === tm.id) || teamsWithLogos[0];
        setTeam(initialTeam);
        setTeamProfile({ id: initialTeam.id, name: initialTeam.name, logoUrl: initialTeam.logoUrl || '' });
    } else {
        let myTeam = globalTeams.find(t => t.id === tm.id) || tm;
        if (!myTeam.logoUrl) {
            myTeam = { ...myTeam, logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(myTeam.name)}&background=random&length=2&bold=true` };
            setGlobalTeams(prev => prev.map(t => t.id === myTeam.id ? myTeam : t));
        }
        setAvailableTeams([myTeam]);
        setTeam(myTeam);
        setTeamProfile({ id: myTeam.id, name: myTeam.name, logoUrl: myTeam.logoUrl || '' });
    }

    // --- AUTOMATIC PROFILE & ROSTER CREATION ---
    if (usr.role === UserRole.Player && !usr.playerId) {
        const existingPlayer = players.find(p => p.name === usr.name && p.teamId === tm.id);
        if (existingPlayer) {
            userWithContext.playerId = existingPlayer.id;
        } else {
            const newPlayerId = `p_new_${Date.now()}`;
            userWithContext.playerId = newPlayerId;
            const newPlayer: Player = {
                id: newPlayerId, teamId: tm.id, name: usr.name, jerseyNumber: 0, position: 'Unknown',
                imageUrl: usr.imageUrl || `https://ui-avatars.com/api/?name=${usr.name}&background=random`,
                height: '-', weight: '-', dob: new Date().toISOString(), gameHistory: [], status: 'Pending', notes: 'Joined via Invite Code',
            };
            setPlayers(prev => [...prev, newPlayer]);
        }
    }

    if (usr.role === UserRole.Parent && !usr.parentId) {
        const newParentProfileId = `pa_new_${Date.now()}`;
        const newParentProfile: ParentProfile = {
            id: newParentProfileId, contactPhone: '', emergencyContactName: '', emergencyContactPhone: '', linkedPlayerIds: [],
        };
        setParentProfiles(prev => [...prev, newParentProfile]);
        userWithContext.parentId = newParentProfileId;
    }

    // --- SYNCHRONIZE GLOBAL USER LIST ---
    setAllUsers(prevAllUsers => {
        const userExists = prevAllUsers.some(u => u.id === userWithContext.id);
        if (userExists) {
            return prevAllUsers.map(u => u.id === userWithContext.id ? userWithContext : u);
        } else {
            return [...prevAllUsers, userWithContext];
        }
    });

    // Set the User state for the current session
    setUser(userWithContext);
    setActiveTab('dashboard');
  };

  const handleSwitchTeam = (teamId: string) => {
      const selected = availableTeams.find(t => t.id === teamId);
      if (selected) {
          setTeam(selected);
          // CRITICAL: Sync TeamProfile state to match the selected team
          // Ensure we use the logoUrl from the selected team, with fallback
          setTeamProfile({
              id: selected.id,
              name: selected.name,
              logoUrl: selected.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.name)}&background=random&length=2&bold=true`
          });
      }
  };

  const handleCreateTeam = (teamData: Partial<Team>) => {
      const newTeam: Team = {
          id: `t_${Date.now()}`,
          name: teamData.name || 'New Team',
          code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          coachId: user?.id || '',
          sport: teamData.sport || user?.sportType || SportType.FOOTBALL,
          ageGroup: teamData.ageGroup || 'Open',
          members: [user?.id || ''],
          logoUrl: teamData.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(teamData.name || 'New Team')}&background=random&length=2&bold=true`
      };
      
      // Update both Session and Global State
      setAvailableTeams(prev => [...prev, newTeam]);
      setGlobalTeams(prev => [...prev, newTeam]);
      
      // Switch to the new team immediately
      setTeam(newTeam);
      setTeamProfile({ id: newTeam.id, name: newTeam.name, logoUrl: newTeam.logoUrl || '' });
      return newTeam;
  };

  const handleUpdateTeam = (teamId: string, updates: Partial<Team>) => {
      // Update Session State
      setAvailableTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updates } : t));
      
      // Update Global State (Persistence across logins)
      setGlobalTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updates } : t));
      
      // If updating currently active team, sync local state
      if (team?.id === teamId) {
          setTeam(prev => prev ? { ...prev, ...updates } : null);
          // Sync TeamProfile state if name/logo changed
          if (updates.name || updates.logoUrl) {
              setTeamProfile(prev => ({
                  ...prev,
                  name: updates.name || prev.name,
                  logoUrl: updates.logoUrl || prev.logoUrl
              }));
          }
      }
  };

  const handleUpdateUser = (updates: Partial<User>) => {
      // 1. Update the current session user
      setUser(prev => prev ? { ...prev, ...updates } : null);

      // 2. Update the user in the global `allUsers` list
      setAllUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updates } : u));
  };

  const handleLogout = () => {
    setUser(null);
    setTeam(null);
    setAiResponse('');
    setAiPrompt('');
    setTpGoals('');
    setActiveTab('dashboard');
    setAvailableTeams([]);
    setIsMobileMenuOpen(false);
    setIsSidebarCollapsed(false);
    // NOTE: We do NOT reset players/events/messages OR globalTeams here. 
    // This ensures the next user sees the updates made by the previous user.
  };

  const handleAiRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) return;

    setIsAiLoading(true);
    setAiResponse('');
    const response = await generateDrillSuggestion(aiPrompt, user?.sportType || 'Football');
    setAiResponse(response);
    setIsAiLoading(false);
  };

  const handleTrainingPlanRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tpGoals) return;

      setIsAiLoading(true);
      setAiResponse('');
      const response = await generateTrainingPlan(tpPosition, tpExperience, tpGoals, user?.sportType || 'Football');
      setAiResponse(response);
      setIsAiLoading(false);
  };
  
  const handleInviteUser = (email: string, role: UserRole) => {
    if (!team) return;

    // Simulate sending an invite
    console.log(`Inviting ${email} as ${role} to team ${team.name} (${team.id})`);

    // Add a pending user to the system for demonstration
    const newMockUser: User = {
        id: `u_mock_${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        role: role,
        status: 'pending',
        teamId: team.id,
    };
    setAllUsers(prev => [...prev, newMockUser]);

    // If it's a player, also add to the player roster
    if (role === UserRole.Player) {
      const newMockPlayer: Player = {
          id: `p_mock_${Date.now()}`,
          teamId: team.id,
          name: newMockUser.name,
          jerseyNumber: 0,
          position: 'Unknown',
          imageUrl: `https://ui-avatars.com/api/?name=${newMockUser.name}&background=random`,
          height: '-',
          weight: '-',
          dob: new Date().toISOString(),
          gameHistory: [],
          status: 'Pending'
      };
      setPlayers(prev => [...prev, newMockPlayer]);
    }
  };

  const handleNavClick = (tab: typeof activeTab) => {
      setActiveTab(tab);
      if (tab === 'vtac') {
        setManagementView('roster'); // Default to roster when clicking main nav
      }
      setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
      setActiveTab('vtac');
      setManagementView('profile');
  };
  
  if (!user || !team) {
    return <AuthFlow onComplete={handleAuthComplete} />;
  }

  const currentUser = user;
  const teamPlayers = players.filter(p => p.teamId === team.id);

  const teamEvents = events.filter(e => e.teamId === team.id);
  const recentActivity = [
      ...teamEvents.map(e => ({ type: 'event' as 'event', data: e })),
      ...messages.filter(m => m.teamId === team.id).map(m => ({ type: 'message' as 'message', data: m }))
  ].sort((a,b) => new Date(b.data.timestamp || b.data.updatedAt).getTime() - new Date(a.data.timestamp || a.data.updatedAt).getTime())
  .slice(0, 5);
  
  const nextMatch = teamEvents
    .filter(e => e.type === EventType.Game || e.type === EventType.HomeGame || e.type === EventType.AwayGame)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .find(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));

  const SidebarLink: React.FC<{ tab: typeof activeTab, icon: string, label: string }> = ({ tab, icon, label }) => (
    <li>
      <button
        onClick={() => handleNavClick(tab)}
        className={`w-full flex items-center p-3 rounded-lg transition-all ${
          activeTab === tab 
          ? 'bg-blue-600/30 text-white shadow-lg' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        <i className={`fas ${icon} w-6 text-center text-lg`}></i>
        {!isSidebarCollapsed && <span className="ml-4 font-semibold">{label}</span>}
      </button>
    </li>
  );
  
  const renderContent = () => {
      switch(activeTab) {
          case 'dashboard':
              return (
                 <div className="p-6 lg:p-8 space-y-6 lg:space-y-8 animate-fade-in">
                    {/* Welcome Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Welcome back, {currentUser.role} {currentUser.name.split(' ')[0]}</h1>
                            <p className="text-slate-400">Here's what's happening with {team.name} today.</p>
                        </div>
                        <div className="hidden md:flex items-center space-x-2 text-sm text-green-400">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span>System Operational</span>
                        </div>
                    </div>

                    {/* STATS CARDS */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-surface p-4 rounded-lg border border-border flex items-center space-x-4"><i className="fas fa-users text-2xl text-blue-400"></i><div><p className="text-2xl font-bold">{teamPlayers.length}</p><p className="text-xs uppercase text-slate-400">Total Players</p></div></div>
                        <div className="bg-surface p-4 rounded-lg border border-border flex items-center space-x-4"><i className="fas fa-calendar-alt text-2xl text-purple-400"></i><div><p className="text-2xl font-bold">{nextMatch ? 0 : 0}</p><p className="text-xs uppercase text-slate-400">Upcoming Matches</p></div></div>
                        <div className="bg-surface p-4 rounded-lg border border-border flex items-center space-x-4"><i className="fas fa-satellite-dish text-2xl text-red-400"></i><div><p className="text-2xl font-bold">{liveGameState?.isLive ? 'Active' : 'Inactive'}</p><p className="text-xs uppercase text-slate-400">Live Game</p></div></div>
                        <div className="bg-surface p-4 rounded-lg border border-border flex items-center space-x-4"><i className="fas fa-envelope text-2xl text-yellow-400"></i><div><p className="text-2xl font-bold">{messages.filter(m => m.teamId === team.id).length}</p><p className="text-xs uppercase text-slate-400">New Messages</p></div></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Next Match */}
                        <div className="md:col-span-1 bg-surface p-6 rounded-lg border border-border">
                             <h3 className="font-bold text-lg mb-4 flex items-center"><i className="fas fa-calendar-check mr-3 text-blue-400"></i>Next Match</h3>
                             {nextMatch ? (
                                <div className="text-center">
                                    <p className="text-slate-400">{new Date(nextMatch.date).toLocaleDateString()}</p>
                                    <p className="text-xl font-bold my-2">vs {nextMatch.opponent}</p>
                                    <button onClick={() => handleNavClick('vtac')} className="text-blue-400 hover:underline text-sm">Go to Schedule</button>
                                </div>
                             ) : (
                                <div className="text-center py-8">
                                    <i className="fas fa-calendar-times text-4xl text-slate-500 mb-4"></i>
                                    <p className="text-slate-400">No upcoming matches scheduled.</p>
                                    <button onClick={() => handleNavClick('vtac')} className="text-blue-400 hover:underline text-sm mt-2">Go to Schedule</button>
                                </div>
                             )}
                        </div>
                        {/* Recent Activity */}
                        <div className="md:col-span-2 bg-surface p-6 rounded-lg border border-border">
                            <h3 className="font-bold text-lg mb-4 flex items-center"><i className="fas fa-history mr-3 text-purple-400"></i>Recent Activity</h3>
                            <ul className="space-y-3">
                                {recentActivity.map((item, i) => (
                                    <li key={i} className="flex items-center space-x-3 text-sm">
                                        <div className={`w-2 h-2 rounded-full ${item.type === 'event' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                                        <div>
                                            {item.type === 'event' && <span className="font-semibold">{(item.data as ScheduleEvent).title} scheduled.</span>}
                                            {item.type === 'message' && <span className="font-semibold">{(item.data as ChatMessage).userName} sent a message</span>}
                                        </div>
                                        <div className="flex-grow text-right text-slate-500 text-xs">
                                            {new Date(item.data.timestamp || item.data.updatedAt).toLocaleDateString()}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    {/* AI Section or Training Plan Section */}
                    {currentUser.role !== UserRole.Parent && (
                      <div className="bg-surface p-6 rounded-lg border border-border">
                          {currentUser.role === UserRole.Player ? (
                            // Personalized Training Plan
                            <div>
                                  <h3 className="font-bold text-lg mb-2 text-white">Personalized Training Plan</h3>
                                  <p className="text-slate-400 mb-4 text-sm">Input your details below to get a custom, AI-generated weekly training regimen designed to elevate your game.</p>
                                  <form onSubmit={handleTrainingPlanRequest} className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div>
                                              <label className="block text-xs font-bold text-slate-400 mb-1">Position</label>
                                              <select value={tpPosition} onChange={e => setTpPosition(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border">
                                                  <option>Striker</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option>
                                              </select>
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-400 mb-1">Experience Level</label>
                                              <select value={tpExperience} onChange={e => setTpExperience(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border">
                                                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                                              </select>
                                          </div>
                                          <div className="md:col-span-3">
                                              <label className="block text-xs font-bold text-slate-400 mb-1">Primary Goals</label>
                                              <textarea 
                                                  value={tpGoals}
                                                  required
                                                  onChange={e => setTpGoals(e.target.value)}
                                                  placeholder="e.g., Improve finishing and off-the-ball movement"
                                                  className="w-full bg-background/50 p-2 rounded border border-border" rows={2}/>
                                          </div>
                                      </div>
                                      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold p-3 rounded-lg flex items-center justify-center space-x-2">
                                          <i className="fas fa-cogs"></i><span>Generate My Plan</span>
                                      </button>
                                  </form>
                              </div>
                          ) : (
                              // AI Assistant Coach
                              <div>
                                  <div className="flex justify-between items-center">
                                      <h3 className="font-bold text-lg text-white flex items-center"><i className="fas fa-robot mr-3 text-purple-400"></i>AI Assistant Coach</h3>
                                      <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full border border-purple-400/20">GEMINI-PRO</span>
                                  </div>
                                  <p className="text-slate-400 my-4 text-sm">Ask for a drill, formation analysis, or session plan.</p>
                                  {isAiLoading && <div className="text-center p-4">Loading...</div>}
                                  {aiResponse ? (
                                      <div className="bg-background/50 p-4 rounded border border-border">
                                          <pre className="whitespace-pre-wrap font-sans text-text-primary">{aiResponse}</pre>
                                      </div>
                                  ) : (
                                      <div className="text-center py-8">
                                          <i className="fas fa-robot text-4xl text-slate-500 mb-4"></i>
                                          <p className="text-slate-400">Ask me anything...</p>
                                      </div>
                                  )}
                                  <form onSubmit={handleAiRequest} className="mt-4 flex items-center space-x-2">
                                      <input 
                                          type="text"
                                          value={aiPrompt}
                                          onChange={e => setAiPrompt(e.target.value)}
                                          placeholder="Ex: Design a high-pressing drill for midfielders..."
                                          className="w-full bg-background/50 p-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-text-primary"
                                      />
                                      <button type="submit" className="bg-primary hover:bg-primary-focus p-3 rounded-lg"><i className="fas fa-paper-plane text-xl"></i></button>
                                  </form>
                              </div>
                          )}
                      </div>
                    )}
                </div>
              );
          case 'vtac':
            return <VTACManagement 
                user={currentUser} 
                team={team}
                availableTeams={availableTeams}
                players={players}
                allUsers={allUsers}
                events={events}
                messages={messages}
                liveGameState={liveGameState}
                teamProfile={teamProfile}
                managerProfiles={managerProfiles}
                coachProfiles={coachProfiles}
                parentProfiles={parentProfiles}
                setPlayers={setPlayers}
                setEvents={setEvents}
                setMessages={setMessages}
                setLiveGameState={setLiveGameState}
                setTeamProfile={setTeamProfile}
                setManagerProfiles={setManagerProfiles}
                setCoachProfiles={setCoachProfiles}
                setParentProfiles={setParentProfiles}
                onUpdateUser={handleUpdateUser}
                onCreateTeam={handleCreateTeam}
                onUpdateTeam={handleUpdateTeam}
                onSwitchTeam={handleSwitchTeam}
                currentView={managementView}
                onViewChange={setManagementView}
             />;
          case 'members':
            return <MembersView
                team={team}
                players={teamPlayers}
                allUsers={allUsers}
                parentProfiles={parentProfiles}
                teamProfile={teamProfile}
                currentUser={currentUser}
                onInviteUser={handleInviteUser}
            />;
          case 'tactics':
            return <TacticalBoard role={currentUser.role} objects={tacticalObjects} onUpdate={setTacticalObjects} />;
          case 'interactive':
             return <TacticalBoard role={currentUser.role} objects={tacticalObjects} onUpdate={setTacticalObjects} />;
          case 'settings':
            return <div className="p-6">Settings coming soon...</div>;
          default:
            return <div>Select a tab</div>;
      }
  }

  return (
    <div className="h-screen w-screen flex bg-background font-sans">
      {/* Sidebar */}
      <aside className={`bg-[#151925] border-r border-border flex-shrink-0 flex flex-col justify-between transition-all duration-300 relative ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="absolute top-6 -right-3 w-6 h-6 bg-slate-700 hover:bg-primary rounded-full flex items-center justify-center text-white border-2 border-background transition-all z-50"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
            <i className={`fas fa-chevron-left transition-transform text-xs ${isSidebarCollapsed ? 'rotate-180' : ''}`}></i>
        </button>
        <div>
           {/* Logo */}
          <div className={`flex items-center p-5 border-b border-border ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-lg flex items-center justify-center text-xl font-bold text-white shadow-lg">V</div>
            {!isSidebarCollapsed && <span className="ml-3 text-xl font-bold">VTAC<span className="font-light"> MANAGER SUITE</span></span>}
          </div>
          
           {/* Active Team Info */}
           <div className="p-4 border-b border-border">
               {!isSidebarCollapsed && <p className="text-xs text-slate-500 uppercase font-bold mb-2">Active Team</p>}
               <div className={`p-3 rounded-lg ${isSidebarCollapsed ? 'bg-transparent' : 'bg-background/50'}`}>
                    <p className={`font-bold text-white truncate ${isSidebarCollapsed ? 'text-center' : ''}`}>{isSidebarCollapsed ? team.name.substring(0,2) : team.name}</p>
                    <div className="flex items-center text-xs mt-1 text-slate-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {!isSidebarCollapsed && 'Online'}
                        {!isSidebarCollapsed && <span className="ml-auto font-mono bg-slate-700/50 px-1.5 py-0.5 rounded text-slate-300">Code: {team.code}</span>}
                    </div>
               </div>
           </div>

          {/* Navigation */}
          <nav className="p-4">
            <ul className="space-y-2">
              <SidebarLink tab="dashboard" icon="fa-tachometer-alt" label="Dashboard" />
              <SidebarLink tab="vtac" icon="fa-calendar-alt" label="VTAC Management" />
              <SidebarLink tab="tactics" icon="fa-chalkboard-teacher" label="Tactical Board" />
              <SidebarLink tab="interactive" icon="fa-users" label="Interactive Board" />
              <SidebarLink tab="members" icon="fa-users" label="Members" />
              <SidebarLink tab="settings" icon="fa-cog" label="Settings" />
            </ul>
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-border">
          <button 
            onClick={handleProfileClick}
            className="w-full flex items-center p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 overflow-hidden">
                <img src={currentUser.imageUrl || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`} alt={currentUser.name} className="w-full h-full object-cover"/>
            </div>
            {!isSidebarCollapsed && 
                <div className="ml-3 text-left overflow-hidden">
                    <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.role}</p>
                </div>
            }
          </button>
           <button onClick={handleLogout} className={`w-full flex items-center p-3 mt-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                <i className="fas fa-sign-out-alt"></i>
                {!isSidebarCollapsed && <span className="ml-2 text-sm font-semibold">Logout</span>}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
