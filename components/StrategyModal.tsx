import React, { useEffect, useState } from 'react';
import { ScheduleEvent, Player, TeamProfile } from '../types';
import { generateMatchStrategy } from '../services/geminiService';
import { LightBulbIcon } from './icons';

interface StrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: ScheduleEvent | null;
    players: Player[];
    teamProfile: TeamProfile;
}

const StrategyModal: React.FC<StrategyModalProps> = ({ isOpen, onClose, event, players, teamProfile }) => {
    const [strategy, setStrategy] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && event) {
            const fetchStrategy = async () => {
                setLoading(true);
                setStrategy('');
                const result = await generateMatchStrategy(
                    teamProfile.name, 
                    event.opponent || 'Unknown Opponent', 
                    players, 
                    event.notes
                );
                setStrategy(result);
                setLoading(false);
            };
            fetchStrategy();
        }
    }, [isOpen, event, players, teamProfile]);

    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-3xl m-4 max-h-[90vh] flex flex-col border border-border">
                <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <LightBulbIcon className="w-6 h-6 text-yellow-400" />
                        AI Match Strategy
                    </h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto bg-background/50 p-4 rounded-lg">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            <p className="text-text-secondary animate-pulse">Analyzing opponent and roster...</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert max-w-none">
                             <pre className="whitespace-pre-wrap font-sans text-text-primary text-sm leading-relaxed">{strategy}</pre>
                        </div>
                    )}
                </div>
                
                <div className="mt-4 flex justify-end">
                     <button onClick={onClose} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StrategyModal;