import React from 'react';
import { Player, TeamProfile } from '../types';
import PlayerCard from './PlayerCard';

interface ParentDashboardProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  teamProfile: TeamProfile;
}

const ParentDashboard: React.FC<ParentDashboardProps> = ({ players, onSelectPlayer, teamProfile }) => {
  return (
    <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-6 border-b-2 border-border pb-2">
          <h2 className="text-3xl font-bold text-text-primary">My Players</h2>
        </div>
      {players.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {players.map(player => (
                <PlayerCard 
                    key={player.id} 
                    player={player} 
                    onSelect={() => onSelectPlayer(player)} 
                    teamLogoUrl={teamProfile.logoUrl}
                />
            ))}
        </div>
      ) : (
         <div className="text-center py-10 bg-surface rounded-lg border border-border">
            <p className="text-text-secondary">No players are linked to your account yet.</p>
            <p className="text-text-secondary text-sm mt-2">Please go to your profile to link a player using their Member ID.</p>
          </div>
      )}
    </div>
  );
};

export default ParentDashboard;