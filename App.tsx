import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat, Content, Part } from "@google/genai";
import Sidebar from './components/Sidebar';
import ResponseDisplay from './components/ResponseDisplay';
import CodeInput from './components/CodeInput';
import { ChatSession, Message, ChatMode, UploadedFile, ThemeName, Theme } from './types';
import { createChatSession, refactorCode, generateTheme, explainCode } from './services/geminiService';
import { DoubleArrowRightIcon, HyperModeIcon, DeepThoughtModeIcon, VibeModeIcon } from './components/Icons';
import { availableThemes } from './themes';
import ThemeGeneratorModal from './components/ThemeGeneratorModal';

const App: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [chatMode, setChatMode] = useState<ChatMode>('vibe');
    const [suggestionForInput, setSuggestionForInput] = useState<string>('');
    const [theme, setTheme] = useState<ThemeName | string>('purple');
    const [customThemes, setCustomThemes] = useState<Record<string, Theme>>({});
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    
    const chatRef = useRef<Chat | null>(null);
    const activeSession = sessions.find(s => s.id === activeSessionId);

    // Load initial data from localStorage
    useEffect(() => {
        try {
            const storedSessions = localStorage.getItem('chatSessions');
            const storedActiveId = localStorage.getItem('activeChatSessionId');
            const storedTheme = localStorage.getItem('appTheme') as ThemeName;
            const storedCustomThemes = localStorage.getItem('customThemes');

            if (storedCustomThemes) setCustomThemes(JSON.parse(storedCustomThemes));
            if (storedTheme) setTheme(storedTheme);

            const parsedSessions = storedSessions ? JSON.parse(storedSessions) : [];
            if (parsedSessions.length > 0) {
                setSessions(parsedSessions);
                setActiveSessionId(storedActiveId || parsedSessions[0].id);
            }
        } catch (error) {
            console.error("Failed to load from localStorage", error);
        }
    }, []);

    // Persist data to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('chatSessions', JSON.stringify(sessions));
            if (activeSessionId) localStorage.setItem('activeChatSessionId', activeSessionId);
            localStorage.setItem('appTheme', theme);
            localStorage.setItem('customThemes', JSON.stringify(customThemes));
        } catch (error) {
            console.error("Failed to save to localStorage", error);
        }
    }, [sessions, activeSessionId, theme, customThemes]);

    // Apply theme by setting CSS variables
    useEffect(() => {
        const allThemes = { ...availableThemes, ...customThemes };
        const currentTheme = allThemes[theme as ThemeName];
        if (currentTheme) {
            const root = document.documentElement;
            root.style.setProperty('--accent-400', currentTheme.c400);
            root.style.setProperty('--accent-500', currentTheme.c500);
            root.style.setProperty('--accent-600', currentTheme.c600);
        }
    }, [theme, customThemes]);


    useEffect(() => {
        if (activeSession) {
            const history: Content[] = activeSession.messages.map(msg => {
                const parts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [];
                if (msg.sender === 'user' && msg.file) {
                    const mimeType = msg.file.type;
                    const data = msg.file.content.split(',')[1];
                    if (mimeType && data) {
                        parts.push({
                            inlineData: { mimeType, data }
                        });
                    }
                }
                if (msg.text) {
                  parts.push({ text: msg.text });
                }

                return {
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: parts
                };
            });
            chatRef.current = createChatSession(chatMode, history);
        } else {
            chatRef.current = null;
        }
    }, [activeSessionId, sessions, chatMode]);

    const handleNewChat = useCallback(() => {
        const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            title: 'New Chat',
            messages: []
        };
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        if (window.innerWidth < 640) {
          setIsSidebarOpen(false);
        }
    }, []);

    useEffect(() => {
        if (sessions.length === 0) {
            handleNewChat();
        }
    }, [sessions, handleNewChat]);
    

    const handleSendMessage = async (messageText: string, file?: UploadedFile) => {
        if (!activeSessionId || !activeSession || !chatRef.current) {
            return;
        }
        
        setIsLoading(true);
        setSuggestionForInput('');

        const userMessage: Message = { 
            id: Date.now(), 
            text: messageText, 
            sender: 'user',
            file: file
        };
        const isFirstMessage = activeSession.messages.length === 0;
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, userMessage] } : s));

        try {
            const messageParts: Part[] = [];
            if (file) {
                const mimeType = file.type
                const data = file.content.split(',')[1];
                if (mimeType && data) {
                    messageParts.push({
                        inlineData: {
                            mimeType: mimeType,
                            data: data,
                        },
                    });
                }
            }
            if (messageText) {
              messageParts.push({ text: messageText });
            }
            
            const stream = await chatRef.current.sendMessageStream({ message: messageParts });

            let aiResponseText = '';
            const aiMessageId = Date.now() + 1;
            const emptyAiMessage: Message = { id: aiMessageId, text: '', sender: 'ai' };
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, emptyAiMessage] } : s));
            
            for await (const chunk of stream) {
                aiResponseText += chunk.text;
                setSessions(prev => prev.map(s => {
                    if (s.id === activeSessionId) {
                        const updatedMessages = s.messages.map(m => m.id === aiMessageId ? { ...m, text: aiResponseText } : m);
                        return { ...s, messages: updatedMessages };
                    }
                    return s;
                }));
            }

            if (isFirstMessage && (messageText.trim().length > 0 || file)) {
                const titleText = messageText.trim() ? messageText : `File: ${file?.name || 'Analysis'}`;
                const title = titleText.split('\n')[0].substring(0, 40) || 'Untitled Chat';
                handleRenameSession(activeSessionId, title);
            }

        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = { id: Date.now() + 1, text: "Sorry, I encountered an error. Please try again.", sender: 'ai' };
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    const messagesWithoutEmptyBubble = s.messages.filter(m => !(m.sender === 'ai' && m.text === ''));
                    return { ...s, messages: [...messagesWithoutEmptyBubble, errorMessage]};
                }
                return s;
            }));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectSession = (id: string) => {
        if (activeSessionId !== id) {
            setActiveSessionId(id);
        }
        if (window.innerWidth < 640) {
            setIsSidebarOpen(false);
        }
    };

    const handleRenameSession = (id: string, newTitle: string) => {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    };

    const handleDeleteSession = (id: string) => {
        setSessions(prev => {
            const remainingSessions = prev.filter(s => s.id !== id);
            if (activeSessionId === id) {
                setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
            }
            return remainingSessions;
        });
    };

    const handleSelectSuggestion = (suggestion: string) => {
        setSuggestionForInput(suggestion);
    };

    const handleRefactorCode = async (codeToRefactor: string): Promise<string> => {
        const modelMap: Record<ChatMode, string> = {
            'vibe': 'gemini-2.5-flash',
            'hyper': 'gemini-flash-lite-latest',
            'reasoning': 'gemini-2.5-pro'
        };
        const model = modelMap[chatMode];
    
        try {
            return await refactorCode(codeToRefactor, model);
        } catch (error) {
            console.error("Failed to refactor code:", error);
            const errorMessage = `// Error refactoring code: ${error instanceof Error ? error.message : String(error)}`;
            return errorMessage;
        }
    };

    const handleExplainCode = async (codeToExplain: string, language: string): Promise<string> => {
        const modelMap: Record<ChatMode, string> = {
            'vibe': 'gemini-2.5-flash',
            'hyper': 'gemini-flash-lite-latest',
            'reasoning': 'gemini-2.5-pro'
        };
        const model = modelMap[chatMode];
    
        try {
            const explanation = await explainCode(codeToExplain, language, model);
            return explanation;
        } catch (error) {
            console.error("Failed to explain code:", error);
            const errorMessage = `> **Error explaining code:** ${error instanceof Error ? error.message : String(error)}`;
            return errorMessage;
        }
    };

    const handleApplyAIGeneratedTheme = (generatedTheme: Theme) => {
        const newThemeId = `ai-${Date.now()}`;
        setCustomThemes(prev => ({ ...prev, [newThemeId]: generatedTheme }));
        setTheme(newThemeId);
        setIsThemeModalOpen(false);
    };

    const modeIcons: Record<ChatMode, React.ReactNode> = {
        vibe: <VibeModeIcon />,
        hyper: <HyperModeIcon />,
        reasoning: <DeepThoughtModeIcon />,
    };

    const Header = () => (
      <header className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/20 to-black/10 backdrop-blur-xl border-b border-white/10 flex items-center px-4 z-20">
        <div className="flex items-center gap-2">
            {!isSidebarOpen && (
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))]"
                    aria-label="Open sidebar"
                >
                    <DoubleArrowRightIcon />
                </button>
            )}
            <h1 className="text-lg font-semibold text-white hidden sm:block truncate pr-4" title={activeSession?.title}>{activeSession?.title}</h1>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                {(['vibe', 'hyper', 'reasoning'] as ChatMode[]).map(mode => (
                    <button 
                        key={mode} 
                        onClick={() => setChatMode(mode)}
                        className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors flex items-center gap-2 ${chatMode === mode ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white'}`}
                        title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                    >
                        {modeIcons[mode]}
                        <span className="hidden md:inline">{mode}</span>
                    </button>
                ))}
            </div>
        </div>
      </header>
    );

    return (
        <div className="h-screen w-screen bg-gray-900 text-white flex overflow-hidden antialiased">
            <Sidebar 
                sessions={sessions}
                activeSessionId={activeSessionId}
                isOpen={isSidebarOpen}
                onNewChat={handleNewChat}
                onSelectSession={handleSelectSession}
                onRenameSession={handleRenameSession}
                onDeleteSession={handleDeleteSession}
                onToggle={() => setIsSidebarOpen(false)}
                currentTheme={theme}
                availableThemes={{...availableThemes, ...customThemes}}
                onThemeChange={setTheme}
                onOpenAIGenerator={() => setIsThemeModalOpen(true)}
            />
            <div className={`flex-1 flex flex-col relative transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'sm:translate-x-72' : 'translate-x-0'}`}>
                <Header />
                <main className="flex-1 flex flex-col min-h-0">
                    <ResponseDisplay 
                        messages={activeSession?.messages || []}
                        isLoading={isLoading}
                        onSelectSuggestion={handleSelectSuggestion}
                        onRefactorCode={handleRefactorCode}
                        onExplainCode={handleExplainCode}
                    />
                    <div className="w-full bg-gradient-to-t from-black/20 to-black/10 backdrop-blur-xl border-t border-white/10">
                        <CodeInput 
                            onSendMessage={handleSendMessage}
                            isLoading={isLoading}
                            initialValue={suggestionForInput}
                        />
                    </div>
                </main>
            </div>
            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 sm:hidden" />}
            <div className="fixed inset-0 -z-10 bg-gray-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
            <ThemeGeneratorModal 
                isOpen={isThemeModalOpen}
                onClose={() => setIsThemeModalOpen(false)}
                onApplyTheme={handleApplyAIGeneratedTheme}
            />
        </div>
    );
};

export default App;