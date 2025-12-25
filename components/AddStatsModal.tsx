import React, { useState } from 'react';
import { GameStats } from '../types';

interface AddStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  onAddStats: (playerId: string, newStats: GameStats) => void;
}

const AddStatsModal: React.FC<AddStatsModalProps> = ({ isOpen, onClose, playerId, onAddStats }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    opponent: '',
    score: '',
    minutesPlayed: '90',
    goals: '0',
    assists: '0',
    tackles: '0',
    fouls: '0',
    saves: '0',
    playerOfTheMatch: false,
    substitutions: '0',
    penaltiesScored: '0',
    cleanSheet: false,
    redCards: '0',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newStats: GameStats = {
      id: `game_${Date.now()}`,
      date: formData.date,
      opponent: formData.opponent,
      score: formData.score,
      minutesPlayed: parseInt(formData.minutesPlayed, 10) || 0,
      goals: parseInt(formData.goals, 10) || 0,
      assists: parseInt(formData.assists, 10) || 0,
      tackles: parseInt(formData.tackles, 10) || 0,
      fouls: parseInt(formData.fouls, 10) || 0,
      saves: parseInt(formData.saves, 10) || 0,
      playerOfTheMatch: formData.playerOfTheMatch,
      substitutions: parseInt(formData.substitutions, 10) || 0,
      penaltiesScored: parseInt(formData.penaltiesScored, 10) || 0,
      cleanSheet: formData.cleanSheet,
      redCards: parseInt(formData.redCards, 10) || 0,
    };
    onAddStats(playerId, newStats);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-2xl p-8 w-full max-w-lg m-4 border border-border overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-6 text-text-primary">Add New Game Stats</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" />
            <input type="text" name="opponent" placeholder="Opponent" value={formData.opponent} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" required />
            <input type="text" name="score" placeholder="Score (e.g., 2-1 W)" value={formData.score} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" required />
            <input type="number" name="minutesPlayed" placeholder="Minutes Played" value={formData.minutesPlayed} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" />
            <input type="number" name="goals" placeholder="Goals" value={formData.goals} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" />
            <input type="number" name="assists" placeholder="Assists" value={formData.assists} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" />
            <input type="number" name="tackles" placeholder="Tackles" value={formData.tackles} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" />
            <input type="number" name="fouls" placeholder="Fouls" value={formData.fouls} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" />
            <input type="number" name="saves" placeholder="Saves (GK)" value={formData.saves} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" />
            <input type="number" name="substitutions" placeholder="Substitutions" value={formData.substitutions} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" />
            <input type="number" name="penaltiesScored" placeholder="Penalties Scored" value={formData.penaltiesScored} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" />
            <input type="number" name="redCards" placeholder="Red Cards" value={formData.redCards} onChange={handleChange} className="bg-background/50 p-2 rounded border border-border text-text-primary" />
          </div>
          <div className="flex items-center mb-6 space-x-6">
            <div className="flex items-center">
              <input type="checkbox" id="pom" name="playerOfTheMatch" checked={formData.playerOfTheMatch} onChange={handleChange} className="h-4 w-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary" />
              <label htmlFor="pom" className="ml-2 text-sm font-medium text-text-secondary">Player of the Match</label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="cleanSheet" name="cleanSheet" checked={formData.cleanSheet} onChange={handleChange} className="h-4 w-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary" />
              <label htmlFor="cleanSheet" className="ml-2 text-sm font-medium text-text-secondary">Clean Sheet</label>
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">Save Stats</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStatsModal;