
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ScheduleEvent, EventType } from '../types';
import { TrashIcon } from './icons';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveEvent: (eventData: Omit<ScheduleEvent, 'id' | 'rsvps' | 'attendedPlayerIds' | 'updatedAt' | 'teamId'>) => void;
  eventToEdit: ScheduleEvent | null;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onSaveEvent, eventToEdit }) => {
  const [type, setType] = useState<EventType>(EventType.Training);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [opponent, setOpponent] = useState('');
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  const isEditing = !!eventToEdit;

  useEffect(() => {
    if (isOpen) {
      // Reset position when modal opens
      setPosition({ x: 0, y: 0 });

      if (eventToEdit) {
        // Populate form for editing
        setType(eventToEdit.type);
        setDate(eventToEdit.date);
        setTime(eventToEdit.time);
        setLocation(eventToEdit.location);
        setOpponent(eventToEdit.opponent || '');
        setNotes(eventToEdit.notes || '');
        setTitle(eventToEdit.title || '');
      } else {
        // Reset form for new event
        setType(EventType.Training);
        setDate(new Date().toISOString().split('T')[0]);
        setTime('19:00');
        setLocation('');
        setOpponent('');
        setNotes('');
        setTitle('');
      }
    }
  }, [isOpen, eventToEdit]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow interaction with form elements without triggering drag
    if ((e.target as HTMLElement).closest('input, select, textarea, button, label')) return;
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStartPos.current.x, y: e.clientY - dragStartPos.current.y });
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
    if (!location) return; // Basic validation

    onSaveEvent({
      type,
      title: title || type,
      date,
      time,
      location,
      opponent: (type === EventType.Game || type === EventType.HomeGame || type === EventType.AwayGame) ? opponent : undefined,
      notes,
    });
  };

  if (!isOpen) return null;

  const availableTypes = Object.values(EventType).filter(t => t !== EventType.Game);

  return createPortal(
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-32 z-[60] animate-fade-in overflow-y-auto pointer-events-auto">
      <div 
        ref={modalRef}
        onMouseDown={handleMouseDown}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className="bg-surface rounded-lg shadow-2xl p-8 w-full max-w-lg m-4 border border-border relative cursor-move"
      >
        <h2 className="text-2xl font-bold mb-6 text-text-primary">{isEditing ? 'Edit Event' : 'Add New Event'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
             <label htmlFor="eventTitle" className="block text-sm font-medium text-text-secondary mb-1">Title</label>
             <input type="text" id="eventTitle" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary" placeholder="Event Title" />
          </div>
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-text-secondary mb-1">Event Type</label>
            <select
              id="eventType"
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
              className="w-full bg-background/50 p-2 rounded border border-border text-text-primary"
            >
              {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-1">Date</label>
                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary" />
            </div>
            <div>
                <label htmlFor="time" className="block text-sm font-medium text-text-secondary mb-1">Time</label>
                <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary" />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-text-secondary mb-1">Location</label>
            <input type="text" id="location" placeholder="e.g., City Stadium" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary" required />
          </div>

          {(type === EventType.Game || type === EventType.HomeGame || type === EventType.AwayGame) && (
            <div>
              <label htmlFor="opponent" className="block text-sm font-medium text-text-secondary mb-1">Opponent</label>
              <input type="text" id="opponent" placeholder="Opponent's Team Name" value={opponent} onChange={e => setOpponent(e.target.value)} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary" />
            </div>
          )}
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
            <textarea id="notes" placeholder="e.g., Arrive 30 minutes early" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-background/50 p-2 rounded border border-border text-text-primary"></textarea>
          </div>
          
          <div className="flex items-center justify-end pt-6 mt-2 border-t border-border">
             <div className="flex space-x-4">
                <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">{isEditing ? 'Save Changes' : 'Create Event'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddEventModal;
