import React, { useState, useRef, useEffect } from 'react';
import ActionButton from './ActionButton';
import { SendIcon } from './Icons';

interface CodeInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

const CodeInput: React.FC<CodeInputProps> = ({ onSendMessage, isLoading, initialValue }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
        setInput(initialValue);
        textareaRef.current?.focus();
    }
  }, [initialValue]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-black/10 border-t border-white/10 backdrop-blur-lg">
      <div className="relative max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Codey anything..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-14 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
          rows={1}
          disabled={isLoading}
        />
        <div className="absolute right-3 bottom-3">
            <ActionButton onClick={handleSubmit} disabled={!input.trim() || isLoading}>
                <SendIcon />
            </ActionButton>
        </div>
      </div>
    </form>
  );
};

export default CodeInput;