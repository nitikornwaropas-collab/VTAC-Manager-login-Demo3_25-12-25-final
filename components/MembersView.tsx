import React, { useMemo, useState } from 'react';
import { Team, Player, User, UserRole, ParentProfile, TeamProfile } from '../types';
import InviteUserModal from './InviteUserModal';

interface MemberCardProps {
  name: string;
  subtitle?: string;
  imageUrl?: string;
  status?: 'active' | 'pending';
  jerseyNumber?: number; // For players
  parentImages?: string[]; // For players
  childImage?: string; // For parents
}

const MemberCard: React.FC<MemberCardProps> = ({ name, subtitle, imageUrl, status, jerseyNumber, parentImages, childImage }) => {
  const initials = name.split(' ').map(n => n[0]).join('');
  return (
    <div className="bg-surface p-4 rounded-lg flex items-center justify-between space-x-4 border border-border shadow-sm hover:bg-background/50 transition-colors duration-200 relative group">
      <div className="flex items-center space-x-4 overflow-hidden">
        {status === 'pending' && (
          <div className="absolute top-2 right-2 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full font-semibold border border-yellow-400/20 z-10">
            Pending
          </div>
        )}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold overflow-hidden shadow-md">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-text-primary truncate group-hover:text-white">{name}</p>
          {subtitle && <p className="text-sm text-text-secondary truncate">{subtitle}</p>}
        </div>
      </div>
      
      {/* Right-side info */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        {/* For Parents: Show child image */}
        {childImage && (
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-600 shadow-md">
                <img src={childImage} alt="Child" className="w-full h-full object-cover" />
            </div>
        )}

        {/* For Players: Show parent images */}
        {parentImages && parentImages.length > 0 && (
            <div className="flex -space-x-4">
                {parentImages.map((img, index) => (
                    <div key={index} className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-600 shadow-md hover:z-10 transition-transform hover:scale-110">
                        <img src={img} alt={`Parent ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                ))}
            </div>
        )}

        {/* For Players: Show Jersey Number */}
        {jerseyNumber !== undefined && (
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-base font-bold text-text-primary border-2 border-slate-600 shadow-md">
            {jerseyNumber}
          </div>
        )}
      </div>
    </div>
  );
};

interface MembersViewProps {
  team: Team;
  players: Player[];
  allUsers: User[];
  parentProfiles: ParentProfile[];
  teamProfile: TeamProfile;
  currentUser: User;
  onInviteUser: (email: string, role: UserRole) => void;
}

const MembersView: React.FC<MembersViewProps> = ({ 
  team, 
  players, 
  allUsers, 
  parentProfiles, 
  teamProfile, 
  currentUser,
  onInviteUser
}) => {
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.Player);

    const canInvite = currentUser.role === UserRole.Manager || currentUser.role === UserRole.Coach;

    const teamUsers = useMemo(() => allUsers.filter(u => u.teamId === team.id), [allUsers, team.id]);
    
    const managers = useMemo(() => teamUsers.filter(u => u.role === UserRole.Manager), [teamUsers]);
    const coaches = useMemo(() => teamUsers.filter(u => u.role === UserRole.Coach), [teamUsers]);
    
    const enrichedPlayers = useMemo(() => {
        return players.map(player => {
            const parentProfileIds = parentProfiles
                .filter(pp => pp.linkedPlayerIds.includes(player.id))
                .map(pp => pp.id);
            
            const parentUsers = allUsers
                .filter(u => u.parentId && parentProfileIds.includes(u.parentId));

            const parentNames = parentUsers.map(u => u.name).join(', ');
            const parentImages = parentUsers.map(u => u.imageUrl!).filter(Boolean).slice(0, 2);

            return {
                ...player,
                parentNames: parentNames || 'No parents linked',
                parentImages,
            };
        });
    }, [players, parentProfiles, allUsers]);
    
    const enrichedParents = useMemo(() => {
        const parentUserList = teamUsers.filter(u => u.role === UserRole.Parent);

        return parentUserList.map(parentUser => {
            let childName = 'No child linked';
            let childImage: string | undefined = undefined;

            if (parentUser.parentId) {
                const parentProfile = parentProfiles.find(pp => pp.id === parentUser.parentId);
                if (parentProfile && parentProfile.linkedPlayerIds.length > 0) {
                    const child = players.find(p => p.id === parentProfile.linkedPlayerIds[0]);
                    if (child) {
                        childName = child.name;
                        childImage = child.imageUrl;
                    } else {
                        childName = 'Unknown Player';
                    }
                }
            }
            return { ...parentUser, childName, childImage };
        });
    }, [teamUsers, parentProfiles, players]);

    const handleInviteClick = (role: UserRole) => {
        setInviteRole(role);
        setInviteModalOpen(true);
    };

    const handleModalInvite = (email: string, role: UserRole) => {
        onInviteUser(email, role);
        setInviteModalOpen(false);
    };

    const renderSection = (title: string, members: any[], type: 'manager' | 'coach' | 'player' | 'parent') => (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold uppercase tracking-wider text-text-secondary">{title} ({members.length})</h3>
          {canInvite && (type === 'player' || type === 'parent') && (
            <button 
              onClick={() => handleInviteClick(type === 'player' ? UserRole.Player : UserRole.Parent)}
              className="px-4 py-2 text-sm font-semibold text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
            >
              Invite +
            </button>
          )}
        </div>
        {members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => {
                 if (type === 'player') {
                    return (
                        <MemberCard
                            key={member.id}
                            name={member.name}
                            imageUrl={member.imageUrl}
                            status={member.status}
                            subtitle={`Parents: ${member.parentNames}`}
                            jerseyNumber={member.jerseyNumber}
                            parentImages={member.parentImages}
                        />
                    );
                }
                if (type === 'parent') {
                    return (
                        <MemberCard
                            key={member.id}
                            name={member.name}
                            imageUrl={member.imageUrl}
                            status={member.status}
                            subtitle={`Child: ${member.childName}`}
                            childImage={member.childImage}
                        />
                    );
                }
                return ( // For manager/coach
                    <MemberCard
                        key={member.id}
                        name={member.name}
                        imageUrl={member.imageUrl}
                        status={member.status}
                    />
                );
            })}
          </div>
        ) : <p className="text-text-secondary italic">No {title.toLowerCase()} in this team yet.</p>}
      </div>
    );
    
    return (
        <div className="animate-fade-in p-6 lg:p-10">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                <h2 className="text-3xl font-bold text-white">Team Members</h2>
                <div className="flex items-center space-x-3">
                    <span className="font-semibold text-slate-300 hidden sm:block">{teamProfile.name}</span>
                    <img src={teamProfile.logoUrl} alt="Team Logo" className="w-12 h-12 rounded-lg object-contain bg-background/50 p-1" />
                </div>
            </div>

            <div className="space-y-12">
                {renderSection('Managers', managers, 'manager')}
                {renderSection('Coaches', coaches, 'coach')}
                {renderSection('Players', enrichedPlayers, 'player')}
                {renderSection('Parents', enrichedParents, 'parent')}
            </div>

            <InviteUserModal 
                isOpen={isInviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                onInvite={(email) => handleModalInvite(email, inviteRole)}
                teamName={team.name}
                teamCode={team.code}
            />
        </div>
    );
};

export default MembersView;
