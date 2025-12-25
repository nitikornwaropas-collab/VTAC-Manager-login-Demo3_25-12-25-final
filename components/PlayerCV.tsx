
import React, { useMemo, useState } from 'react';
import { Player, GameStats, UserRole, TeamProfile } from '../types';
import { BackIcon, StatsIcon, SummaryIcon, StarIcon, PencilIcon, NotesIcon, HistoryIcon, SubstitutionIcon, ShieldCheckIcon, SoccerBallIcon, WhistleIcon, CardIcon } from './icons';
import AddStatsModal from './AddStatsModal';
import { generatePerformanceSummary } from '../services/geminiService';

interface PlayerCVProps {
  player: Player;
  onBack: () => void;
  currentUserRole: UserRole;
  onAddStats: (playerId: string, newStats: GameStats) => void;
  onUpdatePlayerNotes: (playerId: string, notes: string) => void;
  teamProfile: TeamProfile;
  isOwnProfile?: boolean;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-background/50 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-inner transition-transform hover:scale-105 cursor-pointer border border-border">
    {icon}
    <span className="text-3xl font-bold text-text-primary mt-2">{value}</span>
    <span className="text-xs text-text-secondary uppercase tracking-wider mt-1">{label}</span>
  </div>
);

const PlayerCV: React.FC<PlayerCVProps> = ({ player, onBack, currentUserRole, onAddStats, onUpdatePlayerNotes, teamProfile, isOwnProfile = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(player.notes || '');

  const canEdit = currentUserRole === UserRole.Manager || currentUserRole === UserRole.Coach || currentUserRole === UserRole.AssistantCoach;

  const careerTotals = useMemo(() => {
    return player.gameHistory.reduce(
      (acc, game) => {
        acc.gamesPlayed += 1;
        acc.goals += game.goals;
        acc.assists += game.assists;
        acc.fouls += game.fouls;
        acc.substitutions += game.substitutions || 0;
        if(game.cleanSheet) {
            acc.cleanSheets += 1;
        }
        acc.penaltiesScored += game.penaltiesScored || 0;
        if (game.playerOfTheMatch) {
          acc.pom += 1;
        }
        acc.redCards += game.redCards || 0;
        return acc;
      },
      { gamesPlayed: 0, goals: 0, assists: 0, tackles: 0, saves: 0, pom: 0, substitutions: 0, cleanSheets: 0, penaltiesScored: 0, fouls: 0, redCards: 0 }
    );
  }, [player.gameHistory]);
  
  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    setSummary('');
    try {
      const result = await generatePerformanceSummary(player);
      setSummary(result);
    } catch (error) {
      setSummary('Failed to generate summary.');
    } finally {
      setIsLoadingSummary(false);
    }
  };
  
  const handleSaveNotes = () => {
    onUpdatePlayerNotes(player.id, editedNotes);
    setIsEditingNotes(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors print:hidden"
      >
        <BackIcon className="w-5 h-5" />
        <span>Back to Roster</span>
      </button>

      {/* Team Header Bar */}
      <div className="bg-surface rounded-2xl shadow-xl p-4 flex items-center justify-between border border-border">
        <div className="flex items-center space-x-6">
            <img src={teamProfile.logoUrl} alt={teamProfile.name} className="w-16 h-16 object-contain bg-background/50 rounded-md p-1"/>
            <h2 className="text-3xl font-bold text-text-primary tracking-tight">{teamProfile.name}</h2>
        </div>
        <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-white font-black text-4xl shadow-lg flex-shrink-0">
          {player.jerseyNumber}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-8">
            {/* Player Header Card */}
            <div className="bg-surface rounded-2xl shadow-xl p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 border border-border">
                <img className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-primary shadow-lg flex-shrink-0" src={player.imageUrl} alt={player.name} />
                <div className="flex-grow">
                    <h2 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight">{player.name}</h2>
                    <p className="text-xl text-red-500 font-semibold mt-1">{player.position}</p>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-background/50 p-2 rounded border border-border">
                            <div className="text-xs text-text-secondary uppercase">Height</div>
                            <div className="font-bold">{player.height}</div>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                            <div className="text-xs text-text-secondary uppercase">Weight</div>
                            <div className="font-bold">{player.weight}</div>
                        </div>
                        <div className="bg-background/50 p-2 rounded border border-border">
                            <div className="text-xs text-text-secondary uppercase">Age</div>
                            <div className="font-bold">{new Date().getFullYear() - new Date(player.dob).getFullYear()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gemini Performance Summary Card (Moved) */}
            <div className="bg-surface rounded-2xl shadow-xl p-6 md:p-8 border border-border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold flex items-center space-x-3 text-text-primary"><SummaryIcon className="w-6 h-6 text-primary"/><span>Performance Summary</span></h3>
                    <button onClick={handleGenerateSummary} disabled={isLoadingSummary} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed print:hidden">
                        <SummaryIcon className="w-5 h-5"/>
                        <span>{isLoadingSummary ? 'Generating...' : 'Generate with AI'}</span>
                    </button>
                </div>
                {isLoadingSummary && <div className="text-center p-4 rounded-lg bg-background/50 print:hidden text-text-secondary">Generating summary...</div>}
                {summary && <p className="text-text-primary whitespace-pre-wrap bg-background/50 p-4 rounded-lg border border-border leading-relaxed">{summary}</p>}
            </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2">
          {/* Career Totals Card */}
          <div className="bg-surface rounded-2xl shadow-xl p-6 border border-border">
              <h3 className="text-2xl font-bold flex items-center space-x-2 mb-4 text-text-primary">
                  <StatsIcon className="w-6 h-6 text-primary"/>
                  <span>Career Totals</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard label="Played" value={careerTotals.gamesPlayed} icon={<StatsIcon className="w-8 h-8 text-primary mb-1"/>} />
                  <StatCard label="Goals" value={careerTotals.goals} icon={<SoccerBallIcon className="w-8 h-8 text-primary mb-1"/>} />
                  <StatCard label="Assists" value={careerTotals.assists} icon={<StatsIcon className="w-8 h-8 text-primary mb-1"/>} />
                  <StatCard label="Fouls" value={careerTotals.fouls} icon={<WhistleIcon className="w-8 h-8 text-primary mb-1"/>} />
                  <StatCard label="Subs" value={careerTotals.substitutions} icon={<SubstitutionIcon className="w-8 h-8 text-primary mb-1"/>} />
                  <StatCard label="Clean Sheet" value={careerTotals.cleanSheets} icon={<ShieldCheckIcon className="w-8 h-8 text-primary mb-1"/>} />
                  <StatCard label="Penalty" value={careerTotals.penaltiesScored} icon={<SoccerBallIcon className="w-8 h-8 text-primary mb-1"/>} />
                  <StatCard label="POM" value={careerTotals.pom} icon={<StarIcon className="w-8 h-8 text-primary mb-1"/>} />
                  <StatCard label="Red Card" value={careerTotals.redCards} icon={<CardIcon className="w-8 h-8 text-red-500 mb-1"/>} />
              </div>
          </div>
        </div>
      </div>
      
      {/* Coach's Notes */}
      {canEdit && (
        <div className="bg-surface rounded-2xl shadow-xl p-6 md:p-8 border border-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold flex items-center space-x-3 text-text-primary"><NotesIcon className="w-6 h-6 text-primary"/><span>Coach's Notes</span></h3>
            {!isEditingNotes ? (
              <button onClick={() => setIsEditingNotes(true)} className="bg-background/50 hover:bg-background text-text-secondary font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 print:hidden border border-border">
                <PencilIcon className="w-4 h-4" /><span>Edit</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 print:hidden">
                 <button onClick={() => { setIsEditingNotes(false); setEditedNotes(player.notes || ''); }} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                <button onClick={handleSaveNotes} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">Save</button>
              </div>
            )}
          </div>
          {isEditingNotes ? (
            <textarea value={editedNotes} onChange={(e) => setEditedNotes(e.target.value)} rows={4} className="w-full bg-background/50 p-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none transition-shadow print:hidden text-text-primary" placeholder="Add notes..."/>
          ) : (
             <p className="text-text-secondary whitespace-pre-wrap bg-background/50 p-4 rounded-lg min-h-[100px] border border-border">{player.notes || 'No notes added yet.'}</p>
          )}
        </div>
      )}
      
      {/* Game History */}
      <div className="bg-surface rounded-2xl shadow-xl p-6 md:p-8 border border-border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold flex items-center space-x-3 text-text-primary"><HistoryIcon className="w-6 h-6 text-primary"/><span>Game History</span></h3>
          {canEdit && (
            <button onClick={() => setIsModalOpen(true)} className="bg-secondary hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors print:hidden shadow-lg">+ Add Game Stats</button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-border bg-background/50">
              <tr>
                <th className="p-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                <th className="p-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Opponent</th>
                <th className="p-3 text-sm font-semibold text-text-secondary uppercase tracking-wider">Score</th>
                <th className="p-3 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">MIN</th>
                <th className="p-3 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">G</th>
                <th className="p-3 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">A</th>
                <th className="p-3 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">TKL</th>
                <th className="p-3 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">SV</th>
                <th className="p-3 text-sm font-semibold text-text-secondary uppercase tracking-wider text-center">POM</th>
              </tr>
            </thead>
            <tbody className="text-text-primary">
              {player.gameHistory.slice().reverse().map(game => (
                <tr key={game.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                  <td className="p-3">{game.date}</td>
                  <td className="p-3 font-medium">{game.opponent}</td>
                  <td className="p-3">{game.score}</td>
                  <td className="p-3 text-center">{game.minutesPlayed}</td>
                  <td className="p-3 text-center">{game.goals}</td>
                  <td className="p-3 text-center">{game.assists}</td>
                  <td className="p-3 text-center">{game.tackles}</td>
                  <td className="p-3 text-center">{game.saves}</td>
                  <td className="p-3 text-center">{game.playerOfTheMatch && <StarIcon className="w-5 h-5 text-yellow-400 mx-auto"/>}</td>
                </tr>
              ))}
              {player.gameHistory.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-text-secondary">No game history recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {isOwnProfile && (
        <div className="mt-6 flex justify-end space-x-4 print:hidden">
            <button onClick={() => window.print()} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-full transition-colors">Print CV</button>
        </div>
      )}

      <AddStatsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} playerId={player.id} onAddStats={onAddStats}/>
    </div>
  );
};

export default PlayerCV;
