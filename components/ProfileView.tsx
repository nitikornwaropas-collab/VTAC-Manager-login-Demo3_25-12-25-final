import React, { useState, useRef, useMemo, useEffect } from 'react';
import { User, Player, ManagerProfile, CoachProfile, ParentProfile, UserRole, TeamProfile, Team, SportType } from '../types';
import { BackIcon, CameraIcon } from './icons';
import { GoogleGenAI, Modality } from "@google/genai";

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


interface ProfileViewProps {
    currentUser: User;
    playerProfile?: Player;
    managerProfile?: ManagerProfile;
    coachProfile?: CoachProfile;
    parentProfile?: ParentProfile;
    teamProfile: TeamProfile;
    players: Player[];
    allUsers: User[];
    availableTeams?: Team[];
    onSaveProfile: (
        userData: Partial<User>, 
        playerData: Partial<Player> | null,
        managerData: Partial<ManagerProfile> | null,
        coachData: Partial<CoachProfile> | null,
        parentData: Partial<ParentProfile> | null,
        teamData: Partial<TeamProfile> | null
    ) => void;
    onCreateTeam?: (teamData: Partial<Team>) => void;
    onUpdateTeam?: (teamId: string, updates: Partial<Team>) => void;
    onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
    currentUser, 
    playerProfile, 
    managerProfile,
    coachProfile,
    parentProfile,
    teamProfile,
    players,
    allUsers,
    availableTeams = [],
    onSaveProfile, 
    onCreateTeam,
    onUpdateTeam,
    onBack 
}) => {
    // User state
    const [name, setName] = useState(currentUser.name);
    const [image, setImage] = useState(currentUser.imageUrl);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [linkFeedback, setLinkFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const teamLogoFileInputRef = useRef<HTMLInputElement>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isRemovingBackground, setIsRemovingBackground] = useState(false);

    // General Info for Coach/Manager (Local state for demo)
    const [address, setAddress] = useState(managerProfile?.address || coachProfile?.address || '');
    const [city, setCity] = useState(managerProfile?.city || coachProfile?.city || '');
    const [zip, setZip] = useState(managerProfile?.zip || coachProfile?.zip || '');
    const [yearsExp, setYearsExp] = useState((managerProfile?.yearsExperience || coachProfile?.yearsExperience || '').toString());


    // Player state
    const [jerseyNumber, setJerseyNumber] = useState(playerProfile?.jerseyNumber.toString() || '');
    const [position, setPosition] = useState(playerProfile?.position || '');
    const [height, setHeight] = useState((playerProfile?.height || '').replace(/"/g, "''"));
    const [weight, setWeight] = useState(playerProfile?.weight || '');
    const [dob, setDob] = useState(playerProfile?.dob || '');
    const [bio, setBio] = useState(playerProfile?.bio || managerProfile?.bio || coachProfile?.bio || '');

    // Manager/Coach shared state
    const [contactPhone, setContactPhone] = useState(
        managerProfile?.contactPhone || coachProfile?.contactPhone || parentProfile?.contactPhone || ''
    );
    
    // Coach state
    const [specialization, setSpecialization] = useState(coachProfile?.specialization || '');
    const [certifications, setCertifications] = useState(coachProfile?.certifications || '');

    // Parent state
    const [emergencyContactName, setEmergencyContactName] = useState(parentProfile?.emergencyContactName || '');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState(parentProfile?.emergencyContactPhone || '');
    const [playerMemberIdToLink, setPlayerMemberIdToLink] = useState('');

    // Team state for editing
    const [selectedTeamId, setSelectedTeamId] = useState(teamProfile.id);
    const [editedTeamName, setEditedTeamName] = useState(teamProfile.name);
    const [editedTeamLogo, setEditedTeamLogo] = useState(teamProfile.logoUrl);
    
    // Create Team State
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamSport, setNewTeamSport] = useState(SportType.FOOTBALL);
    const [newTeamAgeGroup, setNewTeamAgeGroup] = useState('');

    const linkedPlayers = useMemo(() => {
        if (parentProfile) {
            return players.filter(p => parentProfile.linkedPlayerIds.includes(p.id));
        }
        return [];
    }, [parentProfile, players]);

    // Update local team form state when selected team changes
    useEffect(() => {
        if (selectedTeamId && availableTeams.length > 0) {
            const teamToEdit = availableTeams.find(t => t.id === selectedTeamId);
            if (teamToEdit) {
                setEditedTeamName(teamToEdit.name);
                setEditedTeamLogo(teamToEdit.logoUrl || '');
            }
        }
    }, [selectedTeamId, availableTeams]);

    const removeImageBackground = async (base64DataUrl: string): Promise<string | null> => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const match = base64DataUrl.match(/^data:(image\/[a-z]+);base64,(.*)$/);
            if (!match) {
                console.error("Invalid data URL");
                return null;
            }
            const mimeType = match[1];
            const base64Data = match[2];

            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            };
            const textPart = {
                text: 'Please perform a professional-grade background removal on this image. The output should be a clean cutout of the subject placed on a solid, pure white (#FFFFFF) background. Ensure the edges of the subject are smooth and the final image is a PNG.',
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [imagePart, textPart],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:image/png;base64,${base64ImageBytes}`;
                }
            }
            return null;
        } catch (error) {
            console.error("Error removing image background:", error);
            setFeedback({ message: "Could not remove background. Using original image.", type: 'error' });
            return null;
        }
    };
    
    const processNewImage = async (imageDataUrl: string) => {
        setIsRemovingBackground(true);
        setFeedback({ message: 'Removing background...', type: 'success' });
        const processedImage = await removeImageBackground(imageDataUrl);
        if (processedImage) {
            setImage(processedImage);
            setFeedback({ message: 'Background removed!', type: 'success' });
        } else {
            setImage(imageDataUrl); // Fallback to original if processing fails
            setFeedback({ message: 'Could not remove background.', type: 'error' });
        }
        setIsRemovingBackground(false);
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if(event.target?.result) {
                    processNewImage(event.target.result as string);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleTeamLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if(event.target?.result) {
                    setEditedTeamLogo(event.target.result as string);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCaptureImage = (imageDataUrl: string) => {
        processNewImage(imageDataUrl);
    };

    const handleCreateTeamSubmit = () => {
        if (!onCreateTeam || !newTeamName) return;
        onCreateTeam({
            name: newTeamName,
            sport: newTeamSport,
            ageGroup: newTeamAgeGroup || 'U12'
        });
        setIsCreatingTeam(false);
        setNewTeamName('');
        setNewTeamAgeGroup('');
        setFeedback({ message: 'Team created successfully!', type: 'success' });
        setTimeout(() => setFeedback(null), 2000);
    }

    const handleLinkPlayer = () => {
        if (!playerMemberIdToLink.trim() || !allUsers || !parentProfile) return;

        const playerUserToLink = allUsers.find(
            u => u.memberId === playerMemberIdToLink.trim() && u.role === UserRole.Player
        );

        if (!playerUserToLink || !playerUserToLink.playerId) {
            setLinkFeedback({ message: 'Incorrect member id', type: 'error' });
            setTimeout(() => setLinkFeedback(null), 3000);
            return;
        }

        if (parentProfile.linkedPlayerIds.includes(playerUserToLink.playerId)) {
            setLinkFeedback({ message: 'This player is already linked.', type: 'error' });
            setTimeout(() => setLinkFeedback(null), 3000);
            setPlayerMemberIdToLink('');
            return;
        }

        const updatedLinkedIds = [...parentProfile.linkedPlayerIds, playerUserToLink.playerId];
        
        onSaveProfile(
            {}, // no user data change
            null,
            null,
            null,
            { linkedPlayerIds: updatedLinkedIds },
            null
        );
        
        setLinkFeedback({ message: `Linked to ${playerUserToLink.name}!`, type: 'success' });
        setPlayerMemberIdToLink('');
        setTimeout(() => setLinkFeedback(null), 3000);
    };

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        
        const userData: Partial<User> = { name, imageUrl: image };
        let playerData: Partial<Player> | null = null;
        let managerData: Partial<ManagerProfile> | null = null;
        let coachData: Partial<CoachProfile> | null = null;
        let parentData: Partial<ParentProfile> | null = null;
        let teamData: Partial<TeamProfile> | null = null;

        // Handle Team Updates
        if ((currentUser.role === UserRole.Manager || currentUser.role === UserRole.Coach)) {
            if (selectedTeamId === teamProfile.id) {
                // Updating the currently active team via main handler
                 teamData = { name: editedTeamName, logoUrl: editedTeamLogo };
            } else if (onUpdateTeam && selectedTeamId) {
                // Updating a different team
                onUpdateTeam(selectedTeamId, { name: editedTeamName, logoUrl: editedTeamLogo });
            }
        }

        switch(currentUser.role) {
            case UserRole.Player:
                playerData = {
                    name, imageUrl: image, jerseyNumber: parseInt(jerseyNumber, 10) || 0,
                    position, height, weight, dob, bio,
                };
                break;
            case UserRole.Manager:
                managerData = { 
                    contactPhone, 
                    bio,
                    address,
                    city,
                    zip,
                    yearsExperience: parseInt(yearsExp, 10) || 0
                };
                break;
            case UserRole.Coach:
                coachData = { 
                    specialization, 
                    certifications, 
                    contactPhone, 
                    bio,
                    address,
                    city,
                    zip,
                    yearsExperience: parseInt(yearsExp, 10) || 0
                };
                break;
            case UserRole.Parent:
                parentData = { contactPhone, emergencyContactName, emergencyContactPhone };
                break;
        }

        onSaveProfile(userData, playerData, managerData, coachData, parentData, teamData);

        setFeedback({ message: 'Profile updated successfully!', type: 'success' });
        setTimeout(() => setFeedback(null), 2000);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
            >
                <BackIcon className="w-5 h-5" />
                <span>Back</span>
            </button>

            <div className="bg-surface rounded-lg shadow-lg p-6 space-y-6 border border-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center text-center md:text-left space-y-4 md:space-y-0 md:space-x-6">
                        <div className="flex-shrink-0 relative">
                            <img 
                                className={`w-32 h-32 rounded-full object-cover border-4 border-primary ${isRemovingBackground ? 'opacity-50' : ''}`} 
                                src={image || 'https://i.pravatar.cc/150'} 
                                alt={currentUser.name} 
                            />
                            {isRemovingBackground && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageChange}
                                className="hidden" 
                                accept="image/png, image/jpeg, image/gif"
                            />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-4xl font-extrabold text-text-primary">{name}</h2>
                            <p className="text-xl text-primary font-semibold">{currentUser.role}</p>
                            <p className="text-md text-text-secondary mt-1">{currentUser.email}</p>
                            <div className="flex justify-center md:justify-start space-x-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-background/50 hover:bg-background text-text-secondary font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                                    disabled={isRemovingBackground}
                                >
                                    Upload Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCameraOpen(true)}
                                    className="bg-background/50 hover:bg-background text-text-secondary font-bold py-2 px-4 rounded-lg transition-colors text-sm flex items-center space-x-2"
                                    disabled={isRemovingBackground}
                                >
                                    <CameraIcon className="w-4 h-4" />
                                    <span>Snap Photo</span>
                                </button>
                            </div>
                        </div>
                    </div>
                     {currentUser.memberId && (
                        <div className="text-center md:text-right flex-shrink-0">
                            <span className="text-xs text-text-secondary uppercase tracking-wider font-bold">Member ID</span>
                            <p className="font-mono text-lg font-bold text-primary bg-background/50 px-4 py-2 rounded-lg border border-border mt-1">{currentUser.memberId}</p>
                        </div>
                     )}
                </div>
            </div>

            <form onSubmit={handleSaveChanges} className="bg-surface rounded-lg shadow-lg p-6 space-y-6 border border-border">
                <h3 className="text-2xl font-bold border-b border-border pb-3">Edit Profile</h3>
                
                 {(currentUser.role === UserRole.Manager || currentUser.role === UserRole.Coach) && (
                    <div className="bg-background/20 p-4 rounded-xl border border-border mb-6">
                        <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
                             <h4 className="text-xl font-bold flex items-center gap-2">
                                 <i className="fas fa-users-cog text-primary"></i>
                                 Team Management
                             </h4>
                             <button 
                                type="button"
                                onClick={() => setIsCreatingTeam(!isCreatingTeam)}
                                className="text-xs bg-primary hover:bg-primary-focus text-white px-3 py-1.5 rounded-lg transition-colors"
                             >
                                 {isCreatingTeam ? 'Cancel Creation' : '+ Create New Team'}
                             </button>
                        </div>

                        {isCreatingTeam ? (
                            <div className="bg-background/40 p-4 rounded-lg border border-blue-500/30 animate-fade-in">
                                <h5 className="font-bold text-blue-300 mb-3">Create New Team</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-1">Team Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-background/50 p-2 rounded border border-border"
                                            value={newTeamName}
                                            onChange={e => setNewTeamName(e.target.value)}
                                            placeholder="e.g. North Star FC"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-1">Sport</label>
                                        <select 
                                            className="w-full bg-background/50 p-2 rounded border border-border"
                                            value={newTeamSport}
                                            onChange={e => setNewTeamSport(e.target.value as SportType)}
                                        >
                                            <option value={SportType.FOOTBALL}>Football</option>
                                            <option value={SportType.BASKETBALL}>Basketball</option>
                                            <option value={SportType.HOCKEY}>Hockey</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-1">Age Group</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-background/50 p-2 rounded border border-border"
                                            value={newTeamAgeGroup}
                                            onChange={e => setNewTeamAgeGroup(e.target.value)}
                                            placeholder="e.g. U14"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button 
                                        type="button"
                                        onClick={handleCreateTeamSubmit}
                                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 px-4 rounded-lg"
                                        disabled={!newTeamName}
                                    >
                                        Create Team
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className="col-span-1 md:col-span-2">
                                     <label className="block text-sm font-medium text-text-secondary mb-1">Select Team to Edit</label>
                                     <select
                                        value={selectedTeamId}
                                        onChange={(e) => setSelectedTeamId(e.target.value)}
                                        className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary mb-4"
                                     >
                                         {availableTeams.map(team => (
                                             <option key={team.id} value={team.id}>
                                                 {team.name} {team.id === teamProfile.id ? '(Active)' : ''}
                                             </option>
                                         ))}
                                     </select>
                                </div>

                                <div>
                                    <label htmlFor="teamName" className="block text-sm font-medium text-text-secondary mb-1">Team Name</label>
                                    <input 
                                        type="text" 
                                        id="teamName"
                                        value={editedTeamName} 
                                        onChange={(e) => setEditedTeamName(e.target.value)} 
                                        className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" 
                                    />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Team Logo</label>
                                    <div className="flex items-center space-x-4">
                                        <img 
                                            className="w-16 h-16 rounded-md object-contain bg-background" 
                                            src={editedTeamLogo} 
                                            alt="Team Logo Preview" 
                                        />
                                        <button type="button" onClick={() => teamLogoFileInputRef.current?.click()} className="bg-background/50 hover:bg-background text-text-secondary font-bold py-2 px-4 rounded-lg transition-colors">
                                            Upload Logo
                                        </button>
                                        <input type="file" ref={teamLogoFileInputRef} onChange={handleTeamLogoChange} className="hidden" accept="image/*" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Personal Information */}
                <div className="space-y-4">
                    <h4 className="text-xl font-bold border-b border-border pb-2 mb-4">Personal Information</h4>
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-background/50 p-3 rounded-md border border-border focus:ring-2 focus:ring-primary focus:outline-none text-text-primary"
                        />
                    </div>
                </div>

                {/* Coach Details (Inserted Here) */}
                {currentUser.role === UserRole.Coach && (
                     <div>
                        <h4 className="text-xl font-bold border-b border-border pb-2 mb-4">Coach Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="specialization" className="block text-sm font-medium text-text-secondary mb-1">Specialization</label>
                                <input id="specialization" type="text" placeholder="e.g., Offensive Strategy" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                            <div>
                                <label htmlFor="coachPhone" className="block text-sm font-medium text-text-secondary mb-1">Contact Phone</label>
                                <input id="coachPhone" type="tel" placeholder="Contact Phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label htmlFor="certifications" className="block text-sm font-medium text-text-secondary mb-1">Certifications</label>
                                <input id="certifications" type="text" placeholder="e.g., UEFA A License" value={certifications} onChange={(e) => setCertifications(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label htmlFor="coachBio" className="block text-sm font-medium text-text-secondary mb-1">Coaching Philosophy</label>
                                <textarea id="coachBio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Focusing on creative play..." className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                        </div>
                    </div>
                )}

                 {/* Manager Details (Moved Here for Consistency) */}
                 {currentUser.role === UserRole.Manager && (
                     <div>
                        <h4 className="text-xl font-bold border-b border-border pb-2 mb-4">Manager Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="managerPhone" className="block text-sm font-medium text-text-secondary mb-1">Contact Phone</label>
                                <input id="managerPhone" type="tel" placeholder="Contact Phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                             </div>
                             <div className="col-span-1 md:col-span-2">
                                <label htmlFor="managerBio" className="block text-sm font-medium text-text-secondary mb-1">Bio/Welcome Message</label>
                                <textarea id="managerBio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Manager Bio/Welcome Message..." className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                        </div>
                    </div>
                )}

                {/* General Information for Coach/Manager (Added as requested) */}
                {(currentUser.role === UserRole.Manager || currentUser.role === UserRole.Coach) && (
                    <div className="space-y-4">
                        <h4 className="text-xl font-bold border-b border-border pb-2 mb-4">General Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="address" className="block text-sm font-medium text-text-secondary mb-1">Address</label>
                                <input id="address" type="text" placeholder="Street Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                             </div>
                             <div>
                                <label htmlFor="city" className="block text-sm font-medium text-text-secondary mb-1">City</label>
                                <input id="city" type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                             </div>
                             <div>
                                <label htmlFor="zip" className="block text-sm font-medium text-text-secondary mb-1">Zip Code</label>
                                <input id="zip" type="text" placeholder="Zip Code" value={zip} onChange={(e) => setZip(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                             </div>
                             <div>
                                <label htmlFor="experience" className="block text-sm font-medium text-text-secondary mb-1">Years of Experience</label>
                                <input id="experience" type="number" placeholder="e.g. 5" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                             </div>
                        </div>
                    </div>
                )}
                
                {/* ROLE-SPECIFIC SECTIONS */}
                {currentUser.role === UserRole.Player && playerProfile && (
                     <div>
                        <h4 className="text-xl font-bold border-b border-border pb-2 mb-4">Player Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="jerseyNumber" className="block text-sm font-medium text-text-secondary mb-1">Jersey #</label>
                                <input id="jerseyNumber" type="number" placeholder="Jersey #" value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                            <div>
                                <label htmlFor="position" className="block text-sm font-medium text-text-secondary mb-1">Position</label>
                                <input id="position" type="text" placeholder="Position" value={position} onChange={(e) => setPosition(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                            <div>
                                <label htmlFor="height" className="block text-sm font-medium text-text-secondary mb-1">Height</label>
                                <input id="height" type="text" placeholder="e.g., 5' 10''" value={height} onChange={(e) => setHeight(e.target.value.replace(/"/g, "''"))} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                             <div>
                                <label htmlFor="weight" className="block text-sm font-medium text-text-secondary mb-1">Weight</label>
                                <input id="weight" type="text" placeholder="e.g., 160 lbs" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label htmlFor="dob" className="block text-sm font-medium text-text-secondary mb-1">Date of Birth</label>
                                <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label htmlFor="playerBio" className="block text-sm font-medium text-text-secondary mb-1">Personal Bio</label>
                                <textarea id="playerBio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Personal Bio..." className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                        </div>
                    </div>
                )}

                {currentUser.role === UserRole.Parent && parentProfile && (
                     <div>
                        <h4 className="text-xl font-bold border-b border-border pb-2 mb-4">Parent & Emergency Contact</h4>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-text-secondary mb-2">Linked Player(s):</label>
                            <ul className="list-disc list-inside bg-background/50 p-3 rounded-md text-text-primary">
                                {linkedPlayers.length > 0 ? linkedPlayers.map(p => <li key={p.id}>{p.name}</li>) : <li>No players linked.</li>}
                            </ul>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="parentPhone" className="block text-sm font-medium text-text-secondary mb-1">Your Contact Phone</label>
                                <input id="parentPhone" type="tel" placeholder="Your Contact Phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                            <div/>
                            <div>
                                <label htmlFor="emergencyName" className="block text-sm font-medium text-text-secondary mb-1">Emergency Contact Name</label>
                                <input id="emergencyName" type="text" placeholder="Emergency Contact Name" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                            <div>
                                <label htmlFor="emergencyPhone" className="block text-sm font-medium text-text-secondary mb-1">Emergency Contact Phone</label>
                                <input id="emergencyPhone" type="tel" placeholder="Emergency Contact Phone" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                            <label htmlFor="linkPlayerId" className="block text-sm font-medium text-text-secondary mb-1">Link a New Player</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    id="linkPlayerId"
                                    type="text"
                                    placeholder="Enter Player Member ID"
                                    value={playerMemberIdToLink}
                                    onChange={(e) => setPlayerMemberIdToLink(e.target.value)}
                                    className="flex-grow bg-background/50 p-3 rounded-md border border-border text-text-primary"
                                />
                                <button
                                    type="button"
                                    onClick={handleLinkPlayer}
                                    className="bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg transition-colors"
                                >
                                    Link
                                </button>
                            </div>
                             {linkFeedback && (
                                <p className={`text-sm mt-2 ${linkFeedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                    {linkFeedback.message}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                 <div>
                    <h4 className="text-xl font-bold border-b border-border pb-2 mb-4">Change Password</h4>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
                            <input id="newPassword" type="password" placeholder="New Password" className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" autoComplete="new-password" />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">Confirm New Password</label>
                            <input id="confirmPassword" type="password" placeholder="Confirm New Password" className="w-full bg-background/50 p-3 rounded-md border border-border text-text-primary" autoComplete="new-password" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
                    {feedback && (
                        <p className={`text-sm ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {feedback.message}
                        </p>
                    )}
                    <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Save Changes
                    </button>
                </div>
            </form>

            <CameraModal 
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCaptureImage}
            />
        </div>
    );
};

export default ProfileView;