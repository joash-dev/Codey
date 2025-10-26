import React from 'react';

interface PromptSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
}

const suggestions = [
  { title: "Explain this code", prompt: "Explain this code snippet:\n```javascript\n\n```" },
  { title: "Write a function", prompt: "Write a javascript function that..." },
  { title: "Debug my code", prompt: "I'm getting an error with this code, can you help me debug it?\n```\n\n```" },
  { title: "How do I use...", prompt: "How do I use the `useEffect` hook in React?" },
];

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onSelectSuggestion }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Codey
        </h1>
        <p className="text-gray-400 mt-2">Your helpful AI coding assistant.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestions.map((s) => (
          <button
            key={s.title}
            onClick={() => onSelectSuggestion(s.prompt)}
            className="bg-white/5 p-4 rounded-lg text-left hover:bg-white/10 transition-colors border border-white/10 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))]"
          >
            <p className="font-semibold text-white">{s.title}</p>
            <p className="text-sm text-gray-400 truncate">{s.prompt.split('\n')[0]}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptSuggestions;