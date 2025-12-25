import React, { useState, useEffect } from 'react';
import { Player, ScheduleEvent, User, UserRole } from '../types';
import { EllipsisVerticalIcon } from './icons';

interface PlayerManagementViewProps {
  players: Player[];
  allUsers: User[];
  events: ScheduleEvent[];
  currentUserRole: UserRole;
  onAddPlayer: () => void;
  onUpdatePlayerStatus: (playerId: string, status: 'Active' | 'Injured' | 'Suspended' | 'Unavailable' | 'Pending') => void;
  onDeletePlayer: (playerId: string) => void;
}

const PlayerManagementView: React.FC<PlayerManagementViewProps> = ({ 
    players, 
    allUsers,
    events, 
    currentUserRole, 
    onAddPlayer,
    onUpdatePlayerStatus,
    onDeletePlayer
}) => {
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  const calculateAttendance = (playerId: string) => {
    // Calculate attendance based on attendedPlayerIds in past events
    const pastEvents = events.filter(e => new Date(e.date) < new Date());
    if (pastEvents.length === 0) return 0; // Or handle as "N/A"
    
    const attendedCount = pastEvents.filter(e => e.attendedPlayerIds.includes(playerId)).length;
    return Math.round((attendedCount / pastEvents.length) * 100);
  };

  const getStatusColor = (status?: string) => {
      switch(status?.toLowerCase()) {
          case 'active': return 'text-green-400 border-green-400 bg-green-400/10';
          case 'pending': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
          case 'injured': return 'text-red-400 border-red-400 bg-red-400/10';
          case 'suspended': return 'text-orange-400 border-orange-400 bg-orange-400/10';
          case 'unavailable': return 'text-gray-400 border-gray-400 bg-gray-400/10';
          default: return 'text-green-400 border-green-400 bg-green-400/10';
      }
  };

  // Close menus when clicking outside
  useEffect(() => {
      const handleClickOutside = () => {
          setOpenActionMenuId(null);
          setOpenStatusMenuId(null);
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-text-primary">Player Management</h2>
            <p className="text-text-secondary">Manage player profiles, positions, and availability.</p>
        </div>
        <button
            onClick={onAddPlayer}
            className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 whitespace-nowrap shadow-lg"
        >
            <span>+ Add Player</span>
        </button>
      </div>

      <div className="bg-surface rounded-lg shadow-lg border border-border">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                    <tr className="border-b border-border text-xs uppercase text-text-secondary font-semibold bg-background/30">
                        <th className="p-4">Player</th>
                        <th className="p-4">Member ID</th>
                        <th className="p-4">Number</th>
                        <th className="p-4">Position</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 w-1/4">Attendance</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((player) => {
                        const attendance = calculateAttendance(player.id);
                        const status = player.status || 'Active';
                        const isPending = status === 'Pending';
                        const user = allUsers.find(u => u.playerId === player.id);
                        
                        return (
                            <tr key={player.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors relative group">
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border border-border">
                                             <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-medium text-text-primary group-hover:text-white transition-colors">{player.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-text-secondary font-mono">{user?.memberId || 'N/A'}</td>
                                <td className="p-4 text-text-secondary font-mono">#{player.jerseyNumber}</td>
                                <td className="p-4">
                                    <span className="px-3 py-1 rounded-md bg-background/30 border border-border text-sm text-text-secondary">
                                        {player.position}
                                    </span>
                                </td>
                                <td className="p-4 relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenStatusMenuId(openStatusMenuId === player.id ? null : player.id);
                                            setOpenActionMenuId(null);
                                        }}
                                        className={`px-3 py-1 rounded-md border text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:opacity-80 transition-opacity ${getStatusColor(status)}`}
                                    >
                                        {status}
                                        <span className="text-[10px] ml-1">▼</span>
                                    </button>
                                    {openStatusMenuId === player.id && (
                                        <div className="absolute z-20 mt-2 w-40 bg-surface border border-border rounded-md shadow-2xl overflow-hidden left-0" onClick={(e) => e.stopPropagation()}>
                                            {['Active', 'Pending', 'Injured', 'Suspended', 'Unavailable'].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => {
                                                        onUpdatePlayerStatus(player.id, s as any);
                                                        setOpenStatusMenuId(null);
                                                    }}
                                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-background/50 transition-colors ${status === s ? 'bg-background/30 font-bold text-primary' : 'text-text-primary'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-grow bg-background rounded-full h-2 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${attendance > 80 ? 'bg-green-500' : attendance > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${attendance}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-text-secondary min-w-[3ch]">{attendance}%</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right relative">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenActionMenuId(openActionMenuId === player.id ? null : player.id);
                                            setOpenStatusMenuId(null);
                                        }}
                                        className="text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-background/50 transition-colors relative"
                                    >
                                        <EllipsisVerticalIcon className="w-5 h-5" />
                                        {/* Status Dot */}
                                        <span className={`absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-surface ${isPending ? 'bg-red-500' : 'bg-green-500'}`} />
                                    </button>
                                    {openActionMenuId === player.id && (
                                        <div className="absolute right-0 z-20 mt-1 w-32 bg-surface border border-border rounded-md shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => {
                                                    onUpdatePlayerStatus(player.id, 'Active');
                                                    setOpenActionMenuId(null);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-background/50 hover:text-green-400 transition-colors"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onDeletePlayer(player.id);
                                                    setOpenActionMenuId(null);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-background/50 hover:text-red-300 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default PlayerManagementView;