
import React, { useState, useMemo } from 'react';
import { ScheduleEvent, Player, User, ParentProfile, UserRole, RSVPStatus, TeamProfile } from '../types';
import AddEventModal from './AddEventModal';
import EventCard from './EventCard';
import StrategyModal from './StrategyModal';
import ConfirmationModal from './ConfirmationModal'; // Import the new modal

interface ScheduleViewProps {
  events: ScheduleEvent[];
  players: Player[];
  currentUser: User;
  parentProfile?: ParentProfile;
  onAddEvent: (newEventData: Omit<ScheduleEvent, 'id' | 'rsvps' | 'attendedPlayerIds' | 'updatedAt' | 'teamId'>) => void;
  onUpdateEvent: (updatedEvent: ScheduleEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onUpdateRSVP: (eventId: string, playerId: string, status: RSVPStatus) => void;
  onUpdateAttendance: (eventId: string, playerId: string, isAttending: boolean) => void;
  teamProfile: TeamProfile;
}

const ScheduleView: React.FC<ScheduleViewProps> = (props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<ScheduleEvent | null>(null);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [eventForStrategy, setEventForStrategy] = useState<ScheduleEvent | null>(null);

  // State for the delete confirmation modal
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<ScheduleEvent | null>(null);

  const canAddEvent = props.currentUser.role === UserRole.Manager || 
                      props.currentUser.role === UserRole.Coach || 
                      props.currentUser.role === UserRole.AssistantCoach;

  const displayedEvents = useMemo(() => {
    if (!props.events || props.events.length === 0) {
      return [];
    }
    // Sort descending (Newest/Latest Date First)
    return [...props.events].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
    });
  }, [props.events]);

  const handleOpenAddModal = () => {
      setEventToEdit(null);
      setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: ScheduleEvent) => {
      setEventToEdit(event);
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEventToEdit(null);
  };

  const handleOpenStrategyModal = (event: ScheduleEvent) => {
      setEventForStrategy(event);
      setIsStrategyModalOpen(true);
  }

  const handleCloseStrategyModal = () => {
      setIsStrategyModalOpen(false);
      setEventForStrategy(null);
  }

  // --- DELETE CONFIRMATION HANDLERS ---
  const requestDeleteEvent = (event: ScheduleEvent) => {
    setEventToDelete(event);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (eventToDelete) {
      props.onDeleteEvent(eventToDelete.id);
      setEventToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setEventToDelete(null);
    setIsDeleteConfirmOpen(false);
  };

  const handleSaveEvent = (eventData: Omit<ScheduleEvent, 'id' | 'rsvps' | 'attendedPlayerIds' | 'updatedAt' | 'teamId'>) => {
      if (eventToEdit) {
          const updatedEvent: ScheduleEvent = {
              ...eventToEdit,
              ...eventData,
          };
          props.onUpdateEvent(updatedEvent);
      } else {
          props.onAddEvent(eventData);
      }
      handleCloseModal();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-border">
        <h2 className="text-3xl font-bold text-text-primary">Team Schedule</h2>
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
                <span className="font-semibold text-text-secondary hidden sm:block">{props.teamProfile.name}</span>
                <img src={props.teamProfile.logoUrl} alt="Team Logo" className="w-10 h-10 rounded-md object-contain bg-background/50 p-1" />
            </div>
            {canAddEvent && (
              <button
                onClick={handleOpenAddModal}
                className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                + Add Event
              </button>
            )}
        </div>
      </div>
      
      <div className="space-y-6">
        {displayedEvents.length > 0 ? (
          displayedEvents.map(event => (
            <EventCard 
                key={event.id}
                event={event}
                players={props.players}
                currentUser={props.currentUser}
                parentProfile={props.parentProfile}
                onUpdateRSVP={props.onUpdateRSVP}
                onUpdateAttendance={props.onUpdateAttendance}
                onEdit={() => handleOpenEditModal(event)}
                onDelete={() => requestDeleteEvent(event)} // Pass the whole event object
                onGenerateStrategy={handleOpenStrategyModal}
            />
          ))
        ) : (
          <div className="text-center py-20 bg-surface rounded-lg border border-border min-h-[500px] flex flex-col items-center justify-center">
             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <i className="fas fa-calendar-alt text-4xl text-slate-500 opacity-50"></i>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">No upcoming events</h3>
             <p className="text-slate-400 max-w-sm mx-auto">
                Your schedule is currently empty. Tap the "Add Event" button above to schedule your first game or training session.
             </p>
          </div>
        )}
      </div>

      <AddEventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSaveEvent={handleSaveEvent}
        eventToEdit={eventToEdit}
      />

      <StrategyModal
        isOpen={isStrategyModalOpen}
        onClose={handleCloseStrategyModal}
        event={eventForStrategy}
        players={props.players}
        teamProfile={props.teamProfile}
      />

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={
            <>
              Are you sure you want to delete "<strong>{eventToDelete?.title || eventToDelete?.type}</strong>"? 
              <br />
              This action cannot be undone.
            </>
        }
      />
    </div>
  );
};

export default ScheduleView;
