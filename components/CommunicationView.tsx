
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User, TeamProfile } from '../types';
import { SendIcon, SmileIcon, ImageIcon, CloseIcon } from './icons';

interface CommunicationViewProps {
  messages: ChatMessage[];
  currentUser: User;
  onSendMessage: (content: string, imageUrl?: string) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  teamProfile: TeamProfile;
}

const INPUT_EMOJIS = ['👍', '⚽', '🥅', '🏆', '🔥', '🎉', '💪', '👟', '❤️', '😂', '😮', '😢'];
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '💯'];

const CommunicationView: React.FC<CommunicationViewProps> = ({ messages, currentUser, onSendMessage, onReactToMessage, teamProfile }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, imagePreview]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
              setShowEmojiPicker(false);
          }
          // Close reaction picker if clicking outside
          if (activeReactionPicker && !(event.target as Element).closest('.reaction-trigger')) {
              setActiveReactionPicker(null);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeReactionPicker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() || imagePreview) {
      onSendMessage(newMessage.trim(), imagePreview || undefined);
      setNewMessage('');
      setImagePreview(null);
      setShowEmojiPicker(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setImagePreview(event.target.result as string);
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const addEmoji = (emoji: string) => {
      setNewMessage(prev => prev + emoji);
      setShowEmojiPicker(false);
  };

  const formatTimestamp = (timestamp: string) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
      });
  }

  // Helper to render links clickable
  const renderContentWithLinks = (content: string) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = content.split(urlRegex);
      return parts.map((part, index) => {
          if (part.match(urlRegex)) {
              return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline hover:text-blue-100 break-all">{part}</a>;
          }
          return part;
      });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] bg-surface rounded-lg shadow-lg overflow-hidden border border-border">
      <div className="p-4 border-b border-border flex justify-between items-center bg-surface z-10">
        <h2 className="text-2xl font-bold text-text-primary">Team Chat</h2>
        <div className="flex items-center space-x-3">
            <span className="font-semibold text-text-secondary hidden sm:block">{teamProfile.name}</span>
            <img src={teamProfile.logoUrl} alt="Team Logo" className="w-10 h-10 rounded-md object-contain bg-background/50 p-1" />
        </div>
      </div>

      <div className="flex-grow p-4 space-y-6 overflow-y-auto bg-background/30">
        {messages.map(msg => {
          const isCurrentUser = msg.userId === currentUser.id;
          const reactions = msg.reactions || [];
          
          // Group reactions by emoji
          const reactionGroups = reactions.reduce((acc, r) => {
              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
              return acc;
          }, {} as Record<string, number>);
          
          const groupedReactions = Object.entries(reactionGroups).map(([emoji, count]) => ({
              emoji,
              count,
              userReacted: reactions.some(r => r.emoji === emoji && r.userId === currentUser.id)
          }));

          return (
            <div key={msg.id} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* User Avatar */}
                    {!isCurrentUser && (
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md overflow-hidden">
                             {msg.userAvatarUrl ? (
                                <img src={msg.userAvatarUrl} alt={msg.userName} className="w-full h-full object-cover" />
                             ) : (
                                msg.userName.charAt(0)
                             )}
                         </div>
                    )}
                    
                    <div className={`relative group`}>
                        <div className={`p-3 rounded-2xl shadow-md ${
                                isCurrentUser 
                                    ? 'bg-primary text-white rounded-br-none' 
                                    : 'bg-surface text-text-primary rounded-bl-none border border-border'
                            }`}>
                            {!isCurrentUser && <p className="text-xs font-bold text-secondary mb-1">{msg.userName}</p>}
                            
                            {msg.imageUrl && (
                                <img src={msg.imageUrl} alt="Attachment" className="max-w-full h-auto rounded-lg mb-2 border border-white/10" />
                            )}
                            
                            {msg.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{renderContentWithLinks(msg.content)}</p>}
                        </div>
                        
                        {/* Reactions Area */}
                        <div className={`flex items-center mt-1 space-x-2 ${isCurrentUser ? 'justify-end' : 'justify-start'} flex-wrap gap-y-1`}>
                            <p className="text-[10px] text-text-secondary opacity-70 mr-1">
                                {formatTimestamp(msg.timestamp)}
                            </p>
                            
                            {/* Add Reaction Button */}
                            <div className="relative reaction-trigger">
                                <button 
                                    onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
                                    className="text-text-secondary hover:text-yellow-400 transition-colors p-1 rounded-full hover:bg-background/50"
                                    title="Add reaction"
                                >
                                    <SmileIcon className="w-4 h-4" />
                                </button>
                                
                                {/* Reaction Popover */}
                                {activeReactionPicker === msg.id && (
                                    <div className={`absolute bottom-full mb-1 bg-surface shadow-xl border border-border rounded-full p-1.5 flex space-x-1 z-20 animate-in fade-in zoom-in duration-200 ${isCurrentUser ? 'right-0' : 'left-0'}`}>
                                        {REACTION_EMOJIS.map(emoji => (
                                            <button 
                                                key={emoji} 
                                                onClick={() => {
                                                    onReactToMessage(msg.id, emoji);
                                                    setActiveReactionPicker(null);
                                                }}
                                                className="hover:scale-125 transition-transform text-lg p-1 hover:bg-background/50 rounded"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Display Active Reactions */}
                            {groupedReactions.map(({emoji, count, userReacted}) => (
                                <button 
                                    key={emoji} 
                                    onClick={() => onReactToMessage(msg.id, emoji)}
                                    className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
                                        userReacted 
                                            ? 'bg-primary/20 border-primary text-white' 
                                            : 'bg-background border-border text-text-secondary hover:border-primary/50'
                                    }`}
                                >
                                    <span>{emoji}</span>
                                    <span className="font-semibold">{count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-surface border-t border-border">
        {imagePreview && (
            <div className="mb-3 relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-24 w-auto rounded-lg border border-border shadow-md" />
                <button 
                    onClick={() => setImagePreview(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                >
                    <CloseIcon className="w-3 h-3" />
                </button>
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-end space-x-2 relative">
            {/* Emoji Picker for Input */}
            <div className="relative" ref={emojiPickerRef}>
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-3 text-text-secondary hover:text-yellow-400 transition-colors bg-background/50 rounded-lg hover:bg-background"
                >
                    <SmileIcon className="w-6 h-6" />
                </button>
                {showEmojiPicker && (
                    <div className="absolute bottom-14 left-0 bg-surface border border-border rounded-lg shadow-xl p-2 grid grid-cols-4 gap-2 w-48 z-20">
                        {INPUT_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => addEmoji(emoji)}
                                className="text-2xl hover:bg-background/50 rounded p-1 transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Upload */}
            <div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                    accept="image/*"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-text-secondary hover:text-blue-400 transition-colors bg-background/50 rounded-lg hover:bg-background"
                >
                    <ImageIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Text Input */}
            <div className="flex-grow relative">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={imagePreview ? "Add a caption..." : "Type a message..."}
                    className="w-full bg-background/50 p-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-text-primary"
                    autoComplete="off"
                />
            </div>

            {/* Send Button */}
            <button
                type="submit"
                className="bg-primary hover:bg-primary-focus text-white p-3 rounded-lg transition-all flex-shrink-0 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/50"
                disabled={!newMessage.trim() && !imagePreview}
            >
                <SendIcon className="w-6 h-6" />
            </button>
        </form>
      </div>
    </div>
  );
};

export default CommunicationView;
