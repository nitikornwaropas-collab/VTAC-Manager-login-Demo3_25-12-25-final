
import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole) => void;
  teamName?: string;
  teamCode?: string;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onInvite, teamName = 'VTAC Demo FC', teamCode = 'LOGIN1' }) => {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      // Reset position when modal opens
      if (isOpen) {
          setPosition({ x: 0, y: 0 });
      }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if interacting with inputs or buttons to allow text selection/clicking
    if ((e.target as HTMLElement).closest('input, button, textarea, a')) return;
    
    setIsDragging(true);
    // Calculate initial offset based on mouse position relative to current transform
    dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      
      setPosition({ x: newX, y: newY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Defaulting to Player role as per screenshot context, but could be extended
    onInvite(email, UserRole.Player);
    setFeedback(`Invitation sent to ${email}!`);
    setEmail('');
    
    setTimeout(() => {
        onClose();
        setFeedback('');
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div 
        ref={modalRef}
        onMouseDown={handleMouseDown}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className="bg-[#0F1218] rounded-2xl shadow-2xl w-full max-w-md m-4 border border-white/10 overflow-hidden relative cursor-move"
      >
        
        {/* Close Button Top Right */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 cursor-pointer"
        >
            <i className="fas fa-times text-lg"></i>
        </button>

        <div className="p-8 pt-10 relative">
            {/* Header Icon */}
            <div className="flex justify-center mb-6 pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-[#1E293B] flex items-center justify-center border border-white/5 shadow-inner">
                    <i className="fas fa-envelope text-3xl text-blue-500"></i>
                </div>
            </div>

            <h2 className="text-3xl font-bold text-center text-white mb-2 pointer-events-none">Invite Player</h2>
            <p className="text-center text-slate-400 text-sm mb-8 pointer-events-none">
                Send an invitation code to join <span className="text-white font-semibold">{teamName}</span>
            </p>

            {feedback ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                    <p className="text-green-400 font-medium">{feedback}</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="invite-email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Player Email</label>
                        <input
                            type="email"
                            id="invite-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1A1E2B] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-text"
                            placeholder="player@example.com"
                            required
                        />
                    </div>

                    <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl flex gap-3 items-start pointer-events-none">
                        <i className="fas fa-info-circle text-blue-400 mt-0.5 flex-shrink-0"></i>
                        <p className="text-sm text-blue-200/80 leading-relaxed">
                            This will send an email with Team Code <span className="text-white font-mono font-bold">{teamCode}</span>. The player must use this code to join via the app.
                        </p>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-600/20 border border-white/10 cursor-pointer"
                    >
                        Send Invitation
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default InviteUserModal;
