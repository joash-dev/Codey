import React, { useState, useRef, useEffect } from 'react';
import { ChatSession } from '../types';
import { PlusIcon, ChatBubbleIcon, PencilIcon, TrashIcon, DoubleArrowLeftIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isOpen: boolean;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sessions, activeSessionId, isOpen, onNewChat, onSelectSession, onRenameSession, onDeleteSession, onToggle }) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleStartRename = (session: ChatSession) => {
    setRenamingId(session.id);
    setTempTitle(session.title);
  };

  const handleConfirmRename = () => {
    if (renamingId && tempTitle.trim()) {
      onRenameSession(renamingId, tempTitle);
    }
    setRenamingId(null);
  };

  const handleCancelRename = () => {
    setRenamingId(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      onDeleteSession(deletingId);
    }
    setDeletingId(null);
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const sessionToDelete = sessions.find(s => s.id === deletingId);
  
  return (
    <>
      <aside className={`absolute top-0 left-0 h-full w-72 bg-gradient-to-b from-black/20 to-black/10 backdrop-blur-xl border-r border-white/10 flex flex-col p-3 gap-3 flex-shrink-0 z-20 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2">
            <button 
                onClick={onNewChat}
                className="flex items-center justify-between flex-1 p-3 rounded-lg text-sm font-semibold bg-white/5 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
                <span>New Chat</span>
                <PlusIcon />
            </button>
            <button onClick={onToggle} className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400" aria-label="Close sidebar">
                <DoubleArrowLeftIcon />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto -mr-2 pr-2 min-h-0">
          <nav className="flex flex-col gap-1">
            {sessions.map(session => (
              <div key={session.id} className="relative group">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!renamingId) {
                      onSelectSession(session.id);
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm truncate transition-colors w-full ${
                    activeSessionId === session.id 
                      ? 'bg-white/10 text-white font-semibold' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                  aria-current={activeSessionId === session.id ? 'page' : undefined}
                >
                  <div className="flex-shrink-0">
                    <ChatBubbleIcon />
                  </div>
                  {renamingId === session.id ? (
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={handleConfirmRename}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent border border-purple-400 rounded-md p-0 m-0 leading-tight focus:outline-none -my-1 -mx-2 px-2"
                      onClick={(e) => e.stopPropagation()} // Prevent link navigation
                    />
                  ) : (
                    <span className="flex-1 truncate" title={session.title}>{session.title}</span>
                  )}
                </a>
                {renamingId !== session.id && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 backdrop-blur-sm rounded-md">
                    <button onClick={() => handleStartRename(session)} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10" aria-label={`Rename chat: ${session.title}`}>
                      <PencilIcon />
                    </button>
                    <button onClick={() => handleDeleteRequest(session.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-white/10" aria-label={`Delete chat: ${session.title}`}>
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <ConfirmationModal
        isOpen={!!deletingId}
        title="Delete Chat"
        message={`Are you sure you want to delete "${sessionToDelete?.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
      />
    </>
  );
};

export default Sidebar;