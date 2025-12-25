
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TacticObject, UserRole } from '../types';

interface TacticalBoardProps {
  role: UserRole;
  objects: TacticObject[];
  onUpdate: (newObjects: TacticObject[]) => void;
}

const TacticalBoard: React.FC<TacticalBoardProps> = ({ role, objects, onUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  // Coach only: Add items
  const addObject = (type: 'player' | 'ball' | 'cone', color: string = 'blue') => {
    if (role !== UserRole.Coach) return;
    
    const newObj: TacticObject = {
      id: Date.now().toString(),
      type,
      x: 50, // Center
      y: 50,
      color,
      label: type === 'player' ? 'P' : undefined
    };
    onUpdate([...objects, newObj]);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    if (role !== UserRole.Coach) return; // Read-only for players (in this simplified demo)
    setDraggingId(id);
    e.stopPropagation();
  };

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    // Clamp values
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    const updated = objects.map(obj => 
      obj.id === draggingId ? { ...obj, x: clampedX, y: clampedY } : obj
    );
    onUpdate(updated);
  }, [draggingId, objects, onUpdate]);

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleUp = () => {
    setDraggingId(null);
  };

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [draggingId]);

  return (
    <div className="flex flex-col h-full select-none bg-[#111827]">
      {/* Toolbar - Coach Only */}
      {role === UserRole.Coach && (
        <div className="bg-[#1F2937] p-3 flex justify-center gap-6 border-b border-gray-700 shadow-xl relative z-10">
          <div className="flex gap-3 bg-[#111827] p-1 rounded-lg border border-gray-700">
            <button onClick={() => addObject('player', 'red')} className="flex flex-col items-center justify-center w-16 h-14 rounded hover:bg-white/5 transition group">
                <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-300 mb-1 shadow-sm group-hover:scale-110 transition"></div>
                <span className="text-[10px] font-bold text-red-300 uppercase tracking-wide">Attack</span>
            </button>
            <div className="w-[1px] h-full bg-gray-700"></div>
            <button onClick={() => addObject('player', 'blue')} className="flex flex-col items-center justify-center w-16 h-14 rounded hover:bg-white/5 transition group">
                <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-300 mb-1 shadow-sm group-hover:scale-110 transition"></div>
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wide">Defend</span>
            </button>
          </div>

          <div className="flex gap-3 bg-[#111827] p-1 rounded-lg border border-gray-700">
            <button onClick={() => addObject('ball')} className="flex flex-col items-center justify-center w-14 h-14 rounded hover:bg-white/5 transition group">
                <div className="text-lg group-hover:scale-110 transition">⚽</div>
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wide">Ball</span>
            </button>
            <button onClick={() => addObject('cone')} className="flex flex-col items-center justify-center w-14 h-14 rounded hover:bg-white/5 transition group">
                <div className="text-lg group-hover:scale-110 transition">⚠️</div>
                <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wide">Cone</span>
            </button>
          </div>

          <div className="flex items-center ml-4">
            <button onClick={() => onUpdate([])} className="flex flex-col items-center justify-center w-14 h-14 rounded hover:bg-red-900/20 text-gray-500 hover:text-red-400 transition border border-transparent hover:border-red-500/30">
                <i className="fas fa-trash mb-1"></i>
                <span className="text-[10px]">Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* The Pitch */}
      <div 
        ref={containerRef}
        className="relative flex-grow bg-green-800 overflow-hidden shadow-inner pitch-pattern touch-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Pitch Markings (simplified) */}
        <div className="absolute top-0 left-1/2 h-full w-[2px] bg-white/20 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute left-0 top-1/4 w-16 h-1/2 border-r-2 border-y-2 border-white/20"></div>
        <div className="absolute right-0 top-1/4 w-16 h-1/2 border-l-2 border-y-2 border-white/20"></div>

        {/* Objects */}
        {objects.map((obj) => (
          <div
            key={obj.id}
            onMouseDown={(e) => handleMouseDown(e, obj.id)}
            onTouchStart={(e) => handleMouseDown(e, obj.id)}
            style={{ 
              left: `${obj.x}%`, 
              top: `${obj.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: role === UserRole.Coach ? 'grab' : 'default'
            }}
            className={`absolute w-8 h-8 flex items-center justify-center shadow-xl transition-transform ${draggingId === obj.id ? 'scale-125 z-50 cursor-grabbing' : 'z-10'}`}
          >
             {obj.type === 'player' && (
               <div className={`w-full h-full rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-lg ${obj.color === 'red' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
                 {obj.label}
               </div>
             )}
             {obj.type === 'ball' && (
               <div className="text-2xl drop-shadow-md">⚽</div>
             )}
             {obj.type === 'cone' && (
               <div className="text-yellow-500 text-2xl drop-shadow-md">⚠️</div>
             )}
             
             {role === UserRole.Coach && (
                <div className="absolute -top-8 bg-black/80 px-2 py-0.5 rounded text-[9px] text-white opacity-0 hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 backdrop-blur-sm transition-opacity">
                   {obj.color} {obj.type}
                </div>
             )}
          </div>
        ))}
      </div>
      
      {role === UserRole.Player && (
        <div className="bg-indigo-900/80 backdrop-blur p-2 text-center text-xs text-indigo-200 border-t border-indigo-500/30">
          <i className="fas fa-sync fa-spin mr-2 text-indigo-400"></i> 
          Connected to Live Session
        </div>
      )}
    </div>
  );
};

export default TacticalBoard;
