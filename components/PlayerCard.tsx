import React, { useMemo } from 'react';
import { Player } from '../types';

interface PlayerCardProps {
    player: Player;
    onSelect: () => void;
    teamLogoUrl: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onSelect, teamLogoUrl }) => {
    const careerTotals = useMemo(() => {
        return player.gameHistory.reduce(
          (acc, game) => {
            acc.gamesPlayed += 1;
            acc.goals += game.goals;
            acc.assists += game.assists;
            acc.cleanSheets += game.cleanSheet ? 1 : 0;
            acc.penaltiesScored += game.penaltiesScored || 0;
            if (game.playerOfTheMatch) {
              acc.pom += 1;
            }
            return acc;
          },
          { gamesPlayed: 0, goals: 0, assists: 0, pom: 0, cleanSheets: 0, penaltiesScored: 0 }
        );
    }, [player.gameHistory]);

    const positionAbbr = useMemo(() => {
        const pos = player.position.toLowerCase();
        if (pos.includes('forward') || pos.includes('striker')) return 'ST';
        if (pos.includes('midfielder')) return 'CAM';
        if (pos.includes('defender')) return 'CB';
        if (pos.includes('goalkeeper')) return 'GK';
        if (pos.includes('winger')) return 'RW';
        return player.position.substring(0, 3).toUpperCase();
    }, [player.position]);
    
    // Split name for styling
    const names = player.name.split(' ');
    const firstName = names.length > 1 ? names.slice(0, -1).join(' ').toUpperCase() : '';
    const lastName = names[names.length - 1].toUpperCase();
    
    // Helper for stats - using cqw for perfect internal scaling relative to card width
    const StatItem: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
        <div className="flex flex-col items-center justify-center w-full">
            <p className="font-bold text-white leading-none shadow-black drop-shadow-sm font-mono" style={{ fontSize: '12cqw' }}>
                {value}
            </p>
            <p className="font-bold uppercase text-[#E8C25D] tracking-wider opacity-90" style={{ fontSize: '4cqw', marginTop: '0.5cqw' }}>
                {label}
            </p>
        </div>
    );

    return (
        <div 
            onClick={onSelect}
            className="group relative w-full aspect-[2/3] rounded-[1.5cqw] overflow-hidden cursor-pointer shadow-2xl transition-transform hover:-translate-y-[2cqw] select-none border-[0.5cqw] border-white/20"
            role="button"
            aria-label={`View profile for ${player.name}`}
            style={{ 
                containerType: 'inline-size',
                background: 'linear-gradient(135deg, #bfa05f 0%, #e8c25d 50%, #916f28 100%)'
            } as React.CSSProperties}
        >
            {/* Texture Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 mix-blend-overlay" 
                 style={{
                     backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', 
                     backgroundSize: '3cqw 3cqw'
                 }}
            />
            
            {/* Inner Glow/Shadow for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/50 pointer-events-none" />

            {/* --- LEFT COLUMN (Number, Pos, Line, Logo) --- */}
            {/* Pinned absolutely based on card width using cqw */}
            <div className="absolute flex flex-col items-center z-20 pointer-events-none" 
                 style={{ top: '6cqw', left: '6cqw', width: '20cqw' }}>
                
                {/* Jersey Number - Huge */}
                <span className="font-black text-white leading-none drop-shadow-xl" 
                      style={{ fontSize: '22cqw', textShadow: '0 0.5cqw 1cqw rgba(0,0,0,0.5)' }}>
                    {player.jerseyNumber}
                </span>
                
                {/* Position - Below Number */}
                <span className="font-bold text-white uppercase tracking-widest drop-shadow-md text-center w-full" 
                      style={{ fontSize: '7cqw', marginTop: '-1cqw' }}>
                    {positionAbbr}
                </span>
                
                {/* Divider Line */}
                <div className="bg-white/60" style={{ width: '100%', height: '0.3cqw', margin: '2cqw 0' }}></div>
                
                {/* Team Logo Box */}
                <div className="aspect-square bg-blue-600 flex items-center justify-center shadow-lg border-[0.3cqw] border-white/20 group-hover:scale-105 transition-transform" 
                     style={{ width: '100%', borderRadius: '1.5cqw' }}>
                     {teamLogoUrl ? (
                        <img src={teamLogoUrl} alt="Team" className="w-full h-full object-contain" style={{ padding: '1cqw' }} />
                     ) : (
                        <span className="font-bold text-white" style={{ fontSize: '4cqw' }}>TM</span>
                     )}
                </div>
            </div>

            {/* --- RIGHT COLUMN (Player Image - Circle) --- */}
            <div className="absolute rounded-full border-[1.2cqw] border-gray-500/50 shadow-2xl overflow-hidden bg-gray-800 z-10 pointer-events-none"
                 style={{ 
                     top: '8cqw', 
                     right: '6cqw', 
                     width: '55cqw', 
                     height: '55cqw',
                 }}>
                 <div className="absolute inset-0">
                     <img 
                        src={player.imageUrl} 
                        alt={player.name} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out grayscale-[20%] group-hover:grayscale-0" 
                     />
                 </div>
                 {/* Inner shadow for the circle */}
                 <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none"></div>
            </div>

            {/* --- CENTER (Name) --- */}
            {/* Positioned to overlap bottom of image slightly - Moved up to 65cqw */}
            <div className="absolute z-30 w-full text-center flex flex-col items-center justify-center pointer-events-none"
                 style={{ top: '65cqw', paddingLeft: '2cqw', paddingRight: '2cqw' }}>
                {firstName && (
                    <span className="font-bold text-white/90 uppercase tracking-[0.2em] shadow-black drop-shadow-md w-full truncate relative z-10" 
                          style={{ fontSize: '8cqw', marginBottom: '-0.5cqw' }}>
                        {firstName}
                    </span>
                )}
                <span className="font-black text-white uppercase tracking-tighter leading-none drop-shadow-xl w-full truncate relative z-10" 
                      style={{ fontSize: '14cqw', textShadow: '0 0.5cqw 1cqw rgba(0,0,0,0.6)' }}>
                    {lastName}
                </span>
            </div>

            {/* --- BOTTOM (Stats Box) --- */}
            {/* Increased height to 55cqw */}
            <div className="absolute bg-[#261E14] backdrop-blur-md z-20 border-[0.2cqw] border-white/10 shadow-inner flex flex-col justify-center pointer-events-none"
                 style={{ 
                     bottom: '5cqw', 
                     left: '5cqw', 
                     right: '5cqw', 
                     height: '55cqw',
                     borderRadius: '3cqw',
                     padding: '1cqw 2cqw'
                 }}>
                 <div className="grid grid-cols-3 h-full items-center content-center" style={{ gap: '0.5cqw' }}>
                    <StatItem value={careerTotals.gamesPlayed} label="P" />
                    <StatItem value={careerTotals.goals} label="G" />
                    <StatItem value={careerTotals.assists} label="ASST" />
                    <StatItem value={careerTotals.cleanSheets} label="CS" />
                    <StatItem value={careerTotals.penaltiesScored} label="PEN" />
                    <StatItem value={careerTotals.pom} label="POM" />
                 </div>
            </div>
            
             {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none z-40" />
        </div>
    );
};

export default PlayerCard;
