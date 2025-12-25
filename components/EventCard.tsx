
import React, { useMemo, useState } from 'react';
import { ScheduleEvent, Player, User, ParentProfile, UserRole, RSVPStatus, EventType } from '../types';
import { CalendarIcon, ClockIcon, LocationMarkerIcon, LightBulbIcon, TrashIcon } from './icons';

interface EventCardProps {
  event: ScheduleEvent;
  players: Player[];
  currentUser: User;
  parentProfile?: ParentProfile;
  onUpdateRSVP: (eventId: string, playerId: string, status: RSVPStatus) => void;
  onUpdateAttendance: (eventId: string, playerId: string, isAttending: boolean) => void;
  onEdit: () => void;
  onDelete: () => void; // This will now just trigger the parent modal
  onGenerateStrategy?: (event: ScheduleEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, players, currentUser, parentProfile, onUpdateRSVP, onUpdateAttendance, onEdit, onDelete, onGenerateStrategy }) => {
    const [isAttendanceVisible, setAttendanceVisible] = useState(false);

    const canEdit = currentUser.role === UserRole.Manager || currentUser.role === UserRole.Coach || currentUser.role === UserRole.AssistantCoach;
    const canRSVP = currentUser.role === UserRole.Player || currentUser.role === UserRole.Parent;

    const isGame = event.type === EventType.Game || event.type === EventType.HomeGame || event.type === EventType.AwayGame;

    const eventTypeStyles: { [key: string]: string } = {
        [EventType.Game]: 'bg-red-500 border-red-400',
        [EventType.HomeGame]: 'bg-red-600 border-red-500',
        [EventType.AwayGame]: 'bg-red-500 border-red-400',
        [EventType.Training]: 'bg-blue-500 border-blue-400',
        [EventType.Meeting]: 'bg-green-500 border-green-400',
    };
    
    const linkedPlayers = useMemo(() => {
        if (currentUser.role === UserRole.Parent && parentProfile) {
            return players.filter(p => parentProfile.linkedPlayerIds.includes(p.id));
        }
        if (currentUser.role === UserRole.Player && currentUser.playerId) {
            const player = players.find(p => p.id === currentUser.playerId);
            return player ? [player] : [];
        }
        return [];
    }, [currentUser, parentProfile, players]);

    const rsvpCounts = useMemo(() => {
        return event.rsvps.reduce((acc, rsvp) => {
            acc[rsvp.status] = (acc[rsvp.status] || 0) + 1;
            return acc;
        }, {} as Record<RSVPStatus, number>);
    }, [event.rsvps]);

    const playersRsvpedGoing = useMemo(() => {
        const goingPlayerIds = new Set(event.rsvps.filter(r => r.status === RSVPStatus.Going).map(r => r.playerId));
        return players.filter(p => goingPlayerIds.has(p.id));
    }, [event.rsvps, players]);

    const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });

    const handleAttendanceToggle = (playerId: string, isAttending: boolean) => {
        onUpdateAttendance(event.id, playerId, isAttending);
    }
    
    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(); // Simply call the onDelete prop to trigger the modal in the parent
    };

    const handleStrategyClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onGenerateStrategy) onGenerateStrategy(event);
    };
    
    const RSVPButton: React.FC<{status: RSVPStatus, label: string, currentStatus?: RSVPStatus, onClick: () => void}> = ({status, label, currentStatus, onClick}) => {
        const isActive = currentStatus === status;
        const baseClasses = "py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 cursor-pointer";
        const activeClasses = "bg-primary text-white scale-105 shadow-lg";
        const inactiveClasses = "bg-background/60 hover:bg-surface text-text-secondary hover:text-text-primary";
        
        return (
            <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                {label}
            </button>
        )
    };
    
    const PlayerRSVPControl: React.FC<{player: Player}> = ({player}) => {
        const rsvp = event.rsvps.find(r => r.playerId === player.id);
        
        return (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-background/50 p-3 rounded-lg mt-2">
                <p className="font-semibold text-text-primary mb-2 sm:mb-0">{player.name}</p>
                 <div className="flex space-x-2 p-1 bg-background/80 rounded-lg">
                    <RSVPButton status={RSVPStatus.Going} label="Going" currentStatus={rsvp?.status} onClick={() => onUpdateRSVP(event.id, player.id, RSVPStatus.Going)} />
                    <RSVPButton status={RSVPStatus.NotGoing} label="Not Going" currentStatus={rsvp?.status} onClick={() => onUpdateRSVP(event.id, player.id, RSVPStatus.NotGoing)} />
                    <RSVPButton status={RSVPStatus.Maybe} label="Maybe" currentStatus={rsvp?.status} onClick={() => onUpdateRSVP(event.id, player.id, RSVPStatus.Maybe)} />
                </div>
            </div>
        )
    };

    return (
        <div className="bg-surface rounded-lg shadow-lg overflow-hidden border border-border relative group">
            {/* Header Section */}
            <div className={`p-4 ${eventTypeStyles[event.type]} text-white flex justify-between items-center relative z-10`}>
                <h3 className="text-xl md:text-2xl font-bold truncate pr-4 drop-shadow-sm">{event.title || (isGame ? `Game vs ${event.opponent}`: event.type)}</h3>
                
                {/* Action Buttons Container */}
                <div className="flex items-center gap-2 relative z-20 flex-shrink-0">
                    {canEdit ? (
                        <>
                            {isGame && onGenerateStrategy && (
                                <button
                                    type="button"
                                    onClick={handleStrategyClick}
                                    className="font-semibold px-3 py-1.5 bg-black bg-opacity-30 rounded-lg text-xs md:text-sm hover:bg-opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Generate Match Strategy"
                                >
                                    <div className="pointer-events-none flex items-center gap-1">
                                      <LightBulbIcon className="w-4 h-4" />
                                      <span className="hidden sm:inline">Strategy</span>
                                    </div>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleEditClick}
                                className="font-semibold px-3 py-1.5 bg-black bg-opacity-30 rounded-lg text-xs md:text-sm hover:bg-opacity-50 transition-colors border border-white/10 cursor-pointer"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteClick}
                                className="font-semibold px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs md:text-sm transition-colors border border-white/10 cursor-pointer flex items-center gap-1 shadow-md hover:shadow-lg active:scale-95"
                                title="Delete Event"
                            >
                                <div className="flex items-center gap-1 pointer-events-none">
                                    <TrashIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Delete</span>
                                </div>
                            </button>
                        </>
                    ) : (
                        <span className="font-semibold px-3 py-1 bg-black bg-opacity-20 rounded-full text-xs md:text-sm">{event.type}</span>
                    )}
                </div>
            </div>
            
            {/* Content Section */}
            <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-4 text-text-secondary">
                    <div className="flex items-center space-x-2"><CalendarIcon className="w-5 h-5 text-primary"/><span>{formattedDate}</span></div>
                    <div className="flex items-center space-x-2"><ClockIcon className="w-5 h-5 text-primary"/><span>{event.time}</span></div>
                    <div className="flex items-center space-x-2"><LocationMarkerIcon className="w-5 h-5 text-primary"/><span>{event.location}</span></div>
                </div>
                {event.notes && <p className="text-text-secondary bg-background/50 p-3 rounded-md"><em>{event.notes}</em></p>}
                
                <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-text-primary">RSVPs</h4>
                        <div className="flex space-x-4 text-sm">
                            <span className="text-green-400 font-medium">{rsvpCounts.Going || 0} Going</span>
                            <span className="text-red-400 font-medium">{rsvpCounts['Not Going'] || 0} Not Going</span>
                            <span className="text-yellow-400 font-medium">{rsvpCounts.Maybe || 0} Maybe</span>
                        </div>
                    </div>
                    {canRSVP && linkedPlayers.map(player => (
                        <PlayerRSVPControl key={player.id} player={player} />
                    ))}
                </div>

                {canEdit && (
                    <div className="border-t border-border pt-4">
                        <button onClick={() => setAttendanceVisible(!isAttendanceVisible)} className="font-semibold text-text-primary w-full flex justify-between items-center cursor-pointer hover:text-blue-400 transition-colors">
                            <span>Attendance ({event.attendedPlayerIds.length} / {playersRsvpedGoing.length} Attended)</span>
                            <span className="transform transition-transform">{isAttendanceVisible ? '▲' : '▼'}</span>
                        </button>
                        {isAttendanceVisible && (
                             <div className="mt-4 bg-background/50 p-4 rounded-lg max-h-60 overflow-y-auto">
                                <h5 className="font-bold mb-2">Mark Attendance (Players who RSVP'd 'Going')</h5>
                                {playersRsvpedGoing.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {playersRsvpedGoing.map(player => (
                                            <label key={player.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-surface">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded bg-surface border-border text-primary focus:ring-primary"
                                                    checked={event.attendedPlayerIds.includes(player.id)}
                                                    onChange={(e) => handleAttendanceToggle(player.id, e.target.checked)}
                                                />
                                                <span>{player.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-text-secondary text-sm">No players have RSVP'd "Going" yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventCard;
