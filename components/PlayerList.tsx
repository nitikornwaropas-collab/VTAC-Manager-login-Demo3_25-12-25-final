import React, { useState, useMemo } from 'react';
import { Player, UserRole, TeamProfile, GameStats, Team } from '../types';
import InviteUserModal from './InviteUserModal';
import { InviteIcon } from './icons';
import PlayerCard from './PlayerCard';

interface PlayerListProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  currentUserRole: UserRole;
  onInviteUser: (email: string, role: UserRole) => void;
  teamProfile: TeamProfile;
  availableTeams: Team[];
  currentTeamId: string;
  onSwitchTeam: (teamId: string) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ 
    players, 
    onSelectPlayer, 
    currentUserRole, 
    onInviteUser, 
    teamProfile,
    availableTeams,
    currentTeamId,
    onSwitchTeam
}) => {
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  
  const canInvite = currentUserRole === UserRole.Manager || currentUserRole === UserRole.Coach;
  const showSelector = availableTeams.length > 1 && (currentUserRole === UserRole.Coach || currentUserRole === UserRole.Manager);
  
  return (
    <div className="animate-fade-in pb-10">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-3xl font-bold text-white">Team Roster</h2>
          <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/5 p-1.5 pr-3 rounded-lg border border-white/10 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-md bg-black/30 p-1 flex items-center justify-center">
                    <img src={teamProfile.logoUrl} alt="Team Logo" className="w-full h-full object-contain" />
                  </div>
                  
                  {showSelector ? (
                      <div className="relative group">
                         <select
                            value={currentTeamId}
                            onChange={(e) => onSwitchTeam(e.target.value)}
                            className="appearance-none bg-transparent text-white font-bold text-lg focus:outline-none cursor-pointer pr-6 py-1"
                         >
                            {availableTeams.map(t => (
                                <option key={t.id} value={t.id} className="bg-[#1E293B] text-white">{t.name}</option>
                            ))}
                         </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-slate-400">
                            <i className="fas fa-chevron-down text-xs"></i>
                         </div>
                      </div>
                  ) : (
                      <span className="font-semibold text-slate-300 hidden sm:block text-lg">{teamProfile.name}</span>
                  )}
              </div>
              {canInvite && (
                  <button 
                    onClick={() => setInviteModalOpen(true)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 px-5 rounded-lg transition-all shadow-lg flex items-center space-x-2 border border-white/10"
                  >
                      <InviteIcon className="w-5 h-5"/>
                      <span className="hidden sm:inline">Invite User</span>
                  </button>
              )}
          </div>
        </div>
      
      {/* 
         Responsive Grid:
         The cards will automatically maintain their internal "Gold Card" proportions regardless of the column width.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} onSelect={() => onSelectPlayer(player)} teamLogoUrl={teamProfile.logoUrl} />
        ))}
        {/* Add Player Card Placeholder */}
        {canInvite && (
            <button 
                onClick={() => setInviteModalOpen(true)}
                className="relative w-full aspect-[2/3] rounded-[1.5rem] border-4 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer"
            >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg border border-white/5">
                    <i className="fas fa-plus text-3xl text-slate-400 group-hover:text-white"></i>
                </div>
                <span className="text-slate-400 font-bold text-lg group-hover:text-white">Add Player</span>
            </button>
        )}
      </div>
      
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={onInviteUser}
      />
    </div>
  );
};

export default PlayerList;