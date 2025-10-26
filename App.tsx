import { Chat } from '@google/genai';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import CodeInput from './components/CodeInput';
import ResponseDisplay from './components/ResponseDisplay';
import Sidebar from './components/Sidebar';
import { createChatSession } from './services/geminiService';
import { ChatSession, Message, ChatMode } from './types';
import { DeepThoughtModeIcon, HyperModeIcon, VibeModeIcon, DoubleArrowRightIcon } from './components/Icons';

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('vibe');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [initialPrompt, setInitialPrompt] = useState('');

  const chatRef = useRef<Chat | null>(null);

  const getActiveSession = useCallback((): ChatSession | undefined => {
    return sessions.find(s => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Load sessions from localStorage on initial render
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem('chatSessions');
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions);
        setSessions(parsedSessions);
        const lastSessionId = localStorage.getItem('activeSessionId');
        if (lastSessionId && parsedSessions.some((s: ChatSession) => s.id === lastSessionId)) {
          setActiveSessionId(lastSessionId);
        } else if (parsedSessions.length > 0) {
          setActiveSessionId(parsedSessions[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage", error);
      localStorage.removeItem('chatSessions');
      localStorage.removeItem('activeSessionId');
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('chatSessions', JSON.stringify(sessions));
      if (activeSessionId) {
        localStorage.setItem('activeSessionId', activeSessionId);
      }
    } catch (error) {
      console.error("Failed to save sessions to localStorage", error);
    }
  }, [sessions, activeSessionId]);
  
  // Initialize or update chat instance when active session or mode changes
  useEffect(() => {
    const activeSession = getActiveSession();
    if (activeSession) {
      const history = activeSession.messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
      // This creates a new chat session object when the active session or its messages change.
      // The Gemini SDK's Chat object is stateful, so this ensures it always has the correct history.
      chatRef.current = createChatSession(chatMode, history);
    } else {
      chatRef.current = null;
    }
  }, [activeSessionId, chatMode, getActiveSession]);


  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      messages: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };
  
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };
  
  const handleDeleteSession = (id: string) => {
    const remainingSessions = sessions.filter(s => s.id !== id);
    setSessions(remainingSessions);
    if (activeSessionId === id) {
        setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
    }
  };

  const handleSendMessage = async (message: string) => {
    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
        const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            title: message.substring(0, 40) + (message.length > 40 ? '...' : ''),
            messages: [],
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        currentSessionId = newSession.id;
    }

    const activeSession = sessions.find(s => s.id === currentSessionId) || getActiveSession();
    if (!activeSession) return;
    
    if (activeSession.messages.length === 0 && activeSession.title === 'New Chat') {
        handleRenameSession(currentSessionId, message.substring(0, 40) + (message.length > 40 ? '...' : ''));
    }
    
    const userMessage: Message = { id: Date.now(), text: message, sender: 'user' };
    setSessions(prev => prev.map(s => s.id === currentSessionId ? {...s, messages: [...s.messages, userMessage]} : s));
    setIsLoading(true);

    // Because the useEffect updates chatRef, we wait for the next render cycle to get the updated ref.
    // A small timeout ensures the state update has propagated.
    setTimeout(async () => {
      if (!chatRef.current) {
          console.error("Chat not initialized");
          setIsLoading(false);
          return;
      }
      try {
          const result = await chatRef.current.sendMessageStream({ message });
          
          let aiResponseText = '';
          const aiMessageId = Date.now() + 1;

          for await (const chunk of result) {
              const chunkText = chunk.text;
              if (chunkText) {
                  aiResponseText += chunkText;
                  const aiMessage: Message = { id: aiMessageId, text: aiResponseText, sender: 'ai' };

                  setSessions(prev =>
                      prev.map(s => {
                          if (s.id === currentSessionId) {
                              const otherMessages = s.messages.filter(m => m.id !== aiMessageId && m.sender !== 'user');
                              const userMessages = s.messages.filter(m => m.sender === 'user');
                              return { ...s, messages: [...userMessages, ...otherMessages, aiMessage] };
                          }
                          return s;
                      })
                  );
              }
          }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          id: Date.now() + 1,
          text: 'Oops! Something went wrong. Please try again. 💀',
          sender: 'ai',
        };
        setSessions(prev =>
          prev.map(s =>
            s.id === currentSessionId
              ? { ...s, messages: [...s.messages, errorMessage] }
              : s
          )
        );
      } finally {
        setIsLoading(false);
        setInitialPrompt(''); // Clear initial prompt after sending
      }
    }, 0);
  };
  
  const handleSelectSuggestion = (suggestion: string) => {
    setInitialPrompt(suggestion);
  };

  const activeMessages = getActiveSession()?.messages ?? [];
  
  const ModeButton = ({ mode, label, icon }: { mode: ChatMode; label: string; icon: React.ReactNode }) => (
    <button
        onClick={() => setChatMode(mode)}
        className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 ${
            chatMode === mode ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
  );

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex overflow-hidden font-sans bg-grid-pattern relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/80 to-black/80"></div>
      
      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onToggle={toggleSidebar}
      />
      
      <main className={`flex-1 flex flex-col relative transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>
        <header className="absolute top-0 left-0 right-0 p-3 z-10">
            {!isSidebarOpen && (
              <button onClick={toggleSidebar} className="absolute left-3 top-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400" aria-label="Open sidebar">
                  <DoubleArrowRightIcon />
              </button>
            )}
            <div className="w-full max-w-sm mx-auto p-1 bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl flex items-center">
                <ModeButton mode="vibe" label="Vibe" icon={<VibeModeIcon />} />
                <ModeButton mode="hyper" label="Hyper" icon={<HyperModeIcon />} />
                <ModeButton mode="deepThought" label="Deep Thought" icon={<DeepThoughtModeIcon />} />
            </div>
        </header>

        <ResponseDisplay
          messages={activeMessages}
          isLoading={isLoading}
          onSelectSuggestion={handleSelectSuggestion}
        />
        <CodeInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          initialValue={initialPrompt}
        />
      </main>
    </div>
  );
}

export default App;