import React, { useRef, useEffect } from 'react';
import { Message as MessageType } from '../types';
import MessageBubble from './Message';
import Loader from './Loader';
import PromptSuggestions from './PromptSuggestions';

interface ResponseDisplayProps {
  messages: MessageType[];
  isLoading: boolean;
  onSelectSuggestion: (suggestion: string) => void;
  onRefactorCode: (codeToRefactor: string) => Promise<string>;
  onExplainCode: (codeToExplain: string, language: string) => Promise<string>;
}

const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ messages, isLoading, onSelectSuggestion, onRefactorCode, onExplainCode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return <PromptSuggestions onSelectSuggestion={onSelectSuggestion} />;
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-6 pt-20 md:pt-24">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onRefactorCode={onRefactorCode} onExplainCode={onExplainCode} />
      ))}
      {isLoading && (messages.length === 0 || messages[messages.length - 1]?.sender === 'user') && (
        <MessageBubble message={{ id: Date.now(), text: '', sender: 'ai' }} />
      )}
    </div>
  );
};

export default ResponseDisplay;