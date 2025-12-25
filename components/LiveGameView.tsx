
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { LiveGameState, ScheduleEvent, TeamProfile, Player, User, UserRole, GameEventType, GameEvent, EventType } from '../types';
import { SoccerBallIcon, WhistleIcon, CardIcon, SubstitutionIcon, ShieldCheckIcon, CameraIcon, UploadIcon, NotesIcon, LocationMarkerIcon } from './icons';

interface LiveGameViewProps {
    liveGame: LiveGameState | null;
    currentEvent: ScheduleEvent | null;
    teamProfile: TeamProfile;
    players: Player[];
    currentUser: User;
    onUpdateLiveGame: (updatedState: Partial<LiveGameState>) => void;
    onAddLiveGameEvent: (event: Omit<GameEvent, 'id'>) => void;
}

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageDataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            let mediaStream: MediaStream;
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    mediaStream = stream;
                    setStream(stream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    setError(null);
                })
                .catch(err => {
                    console.error("Error accessing camera:", err);
                    setError("Could not access camera. Please check permissions.");
                });

            return () => {
                if (mediaStream) {
                    mediaStream.getTracks().forEach(track => track.stop());
                }
            };
        } else {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
    }, [isOpen]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const imageDataUrl = canvas.toDataURL('image/jpeg');
                onCapture(imageDataUrl);
                onClose();
            }
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-2xl m-4 flex flex-col border border-border">
                <h2 className="text-xl font-bold mb-4 text-text-primary">Snap Photo</h2>
                {error ? (
                    <p className="text-red-400">{error}</p>
                ) : (
                    <div className="relative">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md bg-black"></video>
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </div>
                )}
                <div className="flex justify-end space-x-4 mt-4">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                    {!error && <button type="button" onClick={handleCapture} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">Capture</button>}
                </div>
            </div>
        </div>
    );
};

interface OperatorControlsProps extends Omit<LiveGameViewProps, 'currentUser' | 'currentEvent'> {
    isAwayGame: boolean;
}

const OperatorControls: React.FC<OperatorControlsProps> = ({ liveGame, teamProfile, players, onUpdateLiveGame, onAddLiveGameEvent, isAwayGame }) => {
    const [minute, setMinute] = useState('');
    const [eventType, setEventType] = useState<GameEventType>(GameEventType.Goal);
    const [player1, setPlayer1] = useState('');
    const [player2, setPlayer2] = useState('');
    const [cornerBy, setCornerBy] = useState('');
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editedNotes, setEditedNotes] = useState('');

    useEffect(() => {
        if (!isEditingNotes && liveGame) {
            setEditedNotes(liveGame.gameNotes || '');
        }
    }, [liveGame?.gameNotes, isEditingNotes]);
    
    if (!liveGame) return null;
    
    const needsPlayer2 = useMemo(() => eventType === GameEventType.Goal || eventType === GameEventType.SubstitutionOn || eventType === GameEventType.SubstitutionOff, [eventType]);

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!minute || !player1) {
            alert("Minute and the primary player are required.");
            return;
        }

        onAddLiveGameEvent({
            minute: parseInt(minute),
            type: eventType,
            playerId: player1,
            secondaryPlayerId: needsPlayer2 ? player2 : undefined,
            team: isAwayGame ? 'away' : 'home', 
            cornerByPlayerId: cornerBy || undefined,
        });

        // Score update logic:
        if (eventType === GameEventType.Goal || eventType === GameEventType.Penalty) {
            if (isAwayGame) {
                onUpdateLiveGame({ awayScore: liveGame.awayScore + 1 });
            } else {
                onUpdateLiveGame({ homeScore: liveGame.homeScore + 1 });
            }
        } else if (eventType === GameEventType.OwnGoal) {
            if (isAwayGame) {
                onUpdateLiveGame({ homeScore: liveGame.homeScore + 1 });
            } else {
                onUpdateLiveGame({ awayScore: liveGame.awayScore + 1 });
            }
        }

        setEventType(GameEventType.Goal);
        setPlayer1('');
        setPlayer2('');
        setCornerBy('');
    };
    
    const handleSaveNotes = () => {
        onUpdateLiveGame({ gameNotes: editedNotes });
        setIsEditingNotes(false);
    };

    const handleCancelEditNotes = () => {
        setEditedNotes(liveGame.gameNotes || ''); // Revert changes
        setIsEditingNotes(false);
    };

    const player1Label = useMemo(() => {
        switch (eventType) {
            case GameEventType.SubstitutionOn:
                return 'Player Coming ON';
            case GameEventType.SubstitutionOff:
                return 'Player Coming OFF';
            default:
                return 'Player';
        }
    }, [eventType]);

    const player2Label = useMemo(() => {
        switch (eventType) {
            case GameEventType.Goal:
                return 'Assisted By (Optional)';
            case GameEventType.SubstitutionOn:
                return 'Player Coming OFF';
            case GameEventType.SubstitutionOff:
                return 'Player Coming ON';
            default:
                return 'Secondary Player';
        }
    }, [eventType]);

    const myTeamScore = isAwayGame ? liveGame.awayScore : liveGame.homeScore;
    const opponentScore = isAwayGame ? liveGame.homeScore : liveGame.awayScore;

    const updateMyScore = (val: number) => {
        if(isAwayGame) onUpdateLiveGame({ awayScore: val });
        else onUpdateLiveGame({ homeScore: val });
    }

    const updateOpponentScore = (val: number) => {
        if(isAwayGame) onUpdateLiveGame({ homeScore: val });
        else onUpdateLiveGame({ awayScore: val });
    }

    return (
        <div className="lg:col-span-2 bg-surface rounded-lg shadow-lg p-4 space-y-4 border border-border">
            <h3 className="text-xl font-bold text-text-primary border-b border-border pb-2">Operator Controls</h3>

            <div className="flex justify-around items-center">
                <div className="text-center">
                    <p className="font-bold">{teamProfile.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                        <button onClick={() => updateMyScore(Math.max(0, myTeamScore - 1))} className="bg-red-500 w-8 h-8 rounded-md font-bold">-</button>
                        <span className="text-2xl font-bold w-10 text-center">{myTeamScore}</span>
                        <button onClick={() => updateMyScore(myTeamScore + 1)} className="bg-green-500 w-8 h-8 rounded-md font-bold">+</button>
                    </div>
                </div>
                <div className="text-center">
                    <p className="font-bold">Opponent</p>
                     <div className="flex items-center space-x-2 mt-1">
                        <button onClick={() => updateOpponentScore(Math.max(0, opponentScore - 1))} className="bg-red-500 w-8 h-8 rounded-md font-bold">-</button>
                        <span className="text-2xl font-bold w-10 text-center">{opponentScore}</span>
                        <button onClick={() => updateOpponentScore(opponentScore + 1)} className="bg-green-500 w-8 h-8 rounded-md font-bold">+</button>
                    </div>
                </div>
            </div>
            
            <form onSubmit={handleAddEvent} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor="minute" className="text-sm">Minute</label>
                        <input type="number" id="minute" value={minute} onChange={e => setMinute(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary" />
                    </div>
                    <div>
                        <label htmlFor="eventType" className="text-sm">Event Type</label>
                        <select id="eventType" value={eventType} onChange={e => setEventType(e.target.value as GameEventType)} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary">
                            {Object.values(GameEventType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="player1" className="text-sm">{player1Label}</label>
                    <select id="player1" value={player1} onChange={e => setPlayer1(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary">
                        <option value="">Select Player</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                {needsPlayer2 && (
                    <div>
                        <label htmlFor="player2" className="text-sm">{player2Label}</label>
                        <select id="player2" value={player2} onChange={e => setPlayer2(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary">
                            <option value="">Select Player</option>
                            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}
                 <div>
                    <label htmlFor="cornerBy" className="text-sm">From Corner By (Optional)</label>
                    <select id="cornerBy" value={cornerBy} onChange={e => setCornerBy(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary">
                        <option value="">Select Player</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <button type="submit" className="w-full bg-primary text-white font-bold py-2 rounded-lg">Add Event</button>
            </form>
            
            <div>
                <label htmlFor="gameNotes" className="text-sm font-medium text-text-secondary mb-1 block">Game Notes</label>
                <textarea 
                    id="gameNotes" 
                    value={editedNotes} 
                    onChange={e => setEditedNotes(e.target.value)} 
                    rows={4} 
                    className="w-full bg-background/50 p-2 rounded border border-border read-only:bg-background/20 read-only:cursor-not-allowed text-text-primary"
                    placeholder="General notes about the game..."
                    readOnly={!isEditingNotes}
                />
                <div className="flex justify-end space-x-2 mt-2">
                    {!isEditingNotes ? (
                        <button type="button" onClick={() => setIsEditingNotes(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                            Edit
                        </button>
                    ) : (
                        <>
                            <button type="button" onClick={handleCancelEditNotes} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                                Cancel
                            </button>
                            <button type="button" onClick={handleSaveNotes} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                                Save
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

interface GameTimelineProps {
    events: GameEvent[];
    players: Player[];
    canOperate: boolean;
    onDeleteEvent: (eventId: string) => void;
    className?: string;
}

const GameTimeline: React.FC<GameTimelineProps> = ({ events, players, canOperate, onDeleteEvent, className }) => {
    
    const getPlayerName = (playerId: string) => {
        return players.find(p => p.id === playerId)?.name || 'Unknown Player';
    };

    const EventIcon: React.FC<{type: GameEventType}> = ({type}) => {
        const icons: {[key in GameEventType]: React.ReactNode} = {
            [GameEventType.Goal]: <SoccerBallIcon className="w-5 h-5 text-green-400" />,
            [GameEventType.OwnGoal]: <SoccerBallIcon className="w-5 h-5 text-red-400" />,
            [GameEventType.Foul]: <WhistleIcon className="w-5 h-5 text-yellow-400" />,
            [GameEventType.YellowCard]: <CardIcon className="w-5 h-5 text-yellow-400" />,
            [GameEventType.RedCard]: <CardIcon className="w-5 h-5 text-red-500" />,
            [GameEventType.SubstitutionOn]: <SubstitutionIcon className="w-5 h-5 text-green-400" />,
            [GameEventType.SubstitutionOff]: <SubstitutionIcon className="w-5 h-5 text-red-400" />,
            [GameEventType.Save]: <ShieldCheckIcon className="w-5 h-5 text-blue-400" />,
            [GameEventType.Penalty]: <SoccerBallIcon className="w-5 h-5 text-green-500" />,
            [GameEventType.Whistle]: <WhistleIcon className="w-5 h-5 text-gray-400" />,
        };
        return <div className="bg-surface p-2 rounded-full">{icons[type]}</div>;
    }

    const eventDescription = (event: GameEvent) => {
        const primaryPlayer = getPlayerName(event.playerId);
        const secondaryPlayer = event.secondaryPlayerId ? getPlayerName(event.secondaryPlayerId) : null;
        
        switch (event.type) {
            case GameEventType.Goal:
                return secondaryPlayer 
                    ? `Goal by ${primaryPlayer}, assisted by ${secondaryPlayer}.`
                    : `Goal by ${primaryPlayer}.`;
            case GameEventType.OwnGoal:
                return `Own goal by ${primaryPlayer}.`;
            case GameEventType.Foul:
                return `Foul by ${primaryPlayer}.`;
            case GameEventType.YellowCard:
                return `Yellow card for ${primaryPlayer}.`;
            case GameEventType.RedCard:
                return `Red card for ${primaryPlayer}.`;
            case GameEventType.SubstitutionOn:
                return `${primaryPlayer} comes ON for ${secondaryPlayer}.`;
            case GameEventType.SubstitutionOff:
                 return `${primaryPlayer} comes OFF for ${secondaryPlayer}.`;
            case GameEventType.Save:
                return `Save by ${primaryPlayer}.`;
            case GameEventType.Penalty:
                return `Penalty scored by ${primaryPlayer}.`;
            default:
                return `${event.type} by ${primaryPlayer}.`;
        }
    }

    return (
        <div className={`bg-surface rounded-lg shadow-lg p-4 border border-border ${className}`}>
            <h3 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">Game Timeline</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {events.length > 0 ? events.map(event => (
                    <div key={event.id} className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-text-primary">{event.minute}'</span>
                            <EventIcon type={event.type} />
                        </div>
                        <div className="bg-background/50 p-3 rounded-lg flex-grow flex justify-between items-center group">
                            <div>
                                <p className="font-semibold">{eventDescription(event)}</p>
                                {event.cornerByPlayerId && <p className="text-xs text-text-secondary">From a corner by {getPlayerName(event.cornerByPlayerId)}</p>}
                            </div>
                            {canOperate && (
                                <button
                                    onClick={() => onDeleteEvent(event.id)}
                                    className="text-red-600 hover:text-red-400 font-bold text-2xl leading-none px-2 rounded-full hover:bg-surface transition-opacity opacity-0 group-hover:opacity-100"
                                    aria-label={`Delete event: ${eventDescription(event)}`}
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-text-secondary py-8">No game events yet. Start the game to begin tracking.</p>
                )}
            </div>
        </div>
    );
};

// Stable TeamBlock component definition
interface TeamBlockProps {
    name: string;
    logoUrl?: string;
    formation: string;
    onFormationChange: (val: string) => void;
    canOperate: boolean;
    isOpponent: boolean;
    onLogoUpload?: () => void;
    onCameraOpen?: () => void;
}

const TeamBlock: React.FC<TeamBlockProps> = React.memo(({ 
    name, logoUrl, formation, onFormationChange, canOperate, isOpponent, onLogoUpload, onCameraOpen 
}) => {
    return (
        <div className="text-center">
            {isOpponent ? (
                 <div className="relative group w-16 h-16 mx-auto mb-1">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Opponent Logo" className="w-16 h-16 rounded-md object-cover"/>
                    ) : (
                        <div className="w-16 h-16 bg-gray-300 rounded-md flex items-center justify-center text-gray-500 text-3xl font-bold">?</div>
                    )}
                    {canOperate && (
                        <div className="absolute inset-0 rounded-md flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={onLogoUpload}
                                className="text-white p-2 rounded-full hover:bg-white/20"
                                aria-label="Upload opponent logo"
                            >
                                <UploadIcon className="w-6 h-6" />
                            </button>
                            <button
                                type="button"
                                onClick={onCameraOpen}
                                className="text-white p-2 rounded-full hover:bg-white/20"
                                aria-label="Snap opponent logo"
                            >
                                <CameraIcon className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <img src={logoUrl} alt={name} className="w-16 h-16 mx-auto mb-1 object-contain"/>
            )}
            
            <p className="font-bold text-xl">{name}</p>
            <input 
                type="text" 
                placeholder="Formation" 
                value={formation} 
                onChange={(e) => onFormationChange(e.target.value)}
                className="mt-1 w-full max-w-[120px] mx-auto bg-background/50 text-text-primary text-center text-sm border border-border rounded p-1 focus:ring-1 focus:ring-primary focus:outline-none"
                disabled={!canOperate}
            />
        </div>
    );
});

const LiveGameView: React.FC<LiveGameViewProps> = ({ liveGame, currentEvent, teamProfile, players, currentUser, onUpdateLiveGame, onAddLiveGameEvent }) => {
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const canOperate = useMemo(() => {
        return currentUser.role === UserRole.Manager || 
               currentUser.role === UserRole.Coach || 
               currentUser.role === UserRole.AssistantCoach;
    }, [currentUser.role]);

    // Determine if it's an Away game based on event type
    const isAwayGame = currentEvent?.type === EventType.AwayGame;
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    onUpdateLiveGame({ opponentLogoUrl: event.target.result as string });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCaptureImage = (imageDataUrl: string) => {
        onUpdateLiveGame({ opponentLogoUrl: imageDataUrl });
    };

    const handleDeleteLiveGameEvent = (eventId: string) => {
        if (!liveGame) return;

        const updatedEvents = liveGame.events.filter(e => e.id !== eventId);
        
        onUpdateLiveGame({
            events: updatedEvents,
        });
    };

    // MEMOIZED HANDLERS to prevent input focus loss
    const setMyTeamFormation = useCallback((val: string) => {
        if (isAwayGame) {
            onUpdateLiveGame({ awayFormation: val });
        } else {
            onUpdateLiveGame({ homeFormation: val });
        }
    }, [isAwayGame, onUpdateLiveGame]);

    const setOpponentFormation = useCallback((val: string) => {
        if (isAwayGame) {
            onUpdateLiveGame({ homeFormation: val });
        } else {
            onUpdateLiveGame({ awayFormation: val });
        }
    }, [isAwayGame, onUpdateLiveGame]);

    if (!currentEvent) {
        return (
            <div className="text-center py-10 bg-surface rounded-lg border border-border">
                <p className="text-text-secondary text-lg">There are no upcoming games scheduled.</p>
                <p className="text-text-secondary mt-2">Add a game to the schedule to use the Live Game feature.</p>
            </div>
        );
    }
    
    if (!liveGame) {
        return (
             <div className="text-center py-10 bg-surface rounded-lg border border-border">
                <p className="text-text-secondary text-lg">Initializing live game state...</p>
            </div>
        );
    }

    // Derived Values for Formation & Teams
    const myTeamName = teamProfile.name;
    const myTeamLogo = teamProfile.logoUrl;
    const myTeamFormation = isAwayGame ? liveGame.awayFormation : liveGame.homeFormation;
    
    const opponentName = currentEvent.opponent || 'Opponent';
    const opponentLogo = liveGame.opponentLogoUrl;
    const opponentFormation = isAwayGame ? liveGame.homeFormation : liveGame.awayFormation;
    
    return (
        <div className="animate-fade-in">
            <div className="bg-surface rounded-lg shadow-lg p-4 mb-6 border border-border">
                <div className="flex justify-between items-center">
                    {/* LEFT SIDE */}
                    {isAwayGame ? (
                         <TeamBlock 
                             key="opponent-team-left"
                             isOpponent={true}
                             name={opponentName}
                             logoUrl={opponentLogo}
                             formation={opponentFormation || ''}
                             onFormationChange={setOpponentFormation}
                             canOperate={canOperate}
                             onLogoUpload={() => fileInputRef.current?.click()}
                             onCameraOpen={() => setIsCameraOpen(true)}
                         />
                    ) : (
                        <TeamBlock 
                             key="my-team-left"
                             isOpponent={false}
                             name={myTeamName}
                             logoUrl={myTeamLogo}
                             formation={myTeamFormation || ''}
                             onFormationChange={setMyTeamFormation}
                             canOperate={canOperate}
                        />
                    )}

                    {/* CENTER */}
                    <div className="text-center flex flex-col items-center justify-center -mt-8">
                        <p className="text-5xl font-black tracking-tighter">
                            {liveGame.homeScore} - {liveGame.awayScore}
                        </p>
                        <div className="text-text-secondary mt-1 font-medium mb-1">
                            {isAwayGame ? (
                                <span>{currentEvent.opponent} (H) vs {teamProfile.name} (A)</span>
                            ) : (
                                <span>{teamProfile.name} (H) vs {currentEvent.opponent} (A)</span>
                            )}
                        </div>
                        <div className="text-xs text-text-secondary mt-2 flex items-center gap-1 border-t border-white/10 pt-2">
                             <LocationMarkerIcon className="w-3 h-3 text-slate-500"/>
                             <span className="text-slate-400 uppercase tracking-wider font-bold text-[10px]">{currentEvent.location}</span>
                        </div>
                        {liveGame.isLive && <span className="text-xs font-bold text-red-500 animate-pulse bg-red-500/10 px-2 py-1 rounded-full block mt-2">● LIVE</span>}
                    </div>

                    {/* RIGHT SIDE */}
                    {isAwayGame ? (
                        <TeamBlock 
                             key="my-team-right"
                             isOpponent={false}
                             name={myTeamName}
                             logoUrl={myTeamLogo}
                             formation={myTeamFormation || ''}
                             onFormationChange={setMyTeamFormation}
                             canOperate={canOperate}
                        />
                    ) : (
                         <TeamBlock 
                             key="opponent-team-right"
                             isOpponent={true}
                             name={opponentName}
                             logoUrl={opponentLogo}
                             formation={opponentFormation || ''}
                             onFormationChange={setOpponentFormation}
                             canOperate={canOperate}
                             onLogoUpload={() => fileInputRef.current?.click()}
                             onCameraOpen={() => setIsCameraOpen(true)}
                         />
                    )}
                </div>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange}
                className="hidden" 
                accept="image/png, image/jpeg, image/gif"
            />

            {canOperate && (
                <div className="my-6">
                    {!liveGame.isLive ? (
                        <button onClick={() => onUpdateLiveGame({ isLive: true })} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg text-lg shadow-lg transition-colors">
                            START GAME
                        </button>
                    ) : (
                        <button onClick={() => onUpdateLiveGame({ isLive: false })} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-lg shadow-lg transition-colors">
                            END GAME & SAVE STATS
                        </button>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <GameTimeline
                    events={liveGame.events}
                    players={players}
                    canOperate={canOperate}
                    onDeleteEvent={handleDeleteLiveGameEvent}
                    className={canOperate ? "lg:col-span-3" : "lg:col-span-5"}
                />
                {canOperate && (
                    <OperatorControls
                        liveGame={liveGame}
                        teamProfile={teamProfile}
                        players={players}
                        onUpdateLiveGame={onUpdateLiveGame}
                        onAddLiveGameEvent={onAddLiveGameEvent}
                        isAwayGame={!!isAwayGame}
                    />
                )}
            </div>

             <div className="mt-6 bg-surface rounded-lg shadow-lg p-6 border border-border">
                <h3 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4 flex items-center gap-2">
                     <NotesIcon className="w-5 h-5 text-primary"/>
                     Coach's Game Notes
                </h3>
                {liveGame.gameNotes ? (
                    <p className="text-text-primary whitespace-pre-wrap leading-relaxed bg-background/30 p-4 rounded-lg">
                        {liveGame.gameNotes}
                    </p>
                ) : (
                    <p className="text-text-secondary italic bg-background/30 p-4 rounded-lg">
                        No game notes available yet.
                    </p>
                )}
            </div>

            <CameraModal 
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCaptureImage}
            />
        </div>
    );
};

export default LiveGameView;
