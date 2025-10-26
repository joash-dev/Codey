import React, { useState, useEffect } from 'react';

interface PromptSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
}

// A larger pool of potential suggestions
const allSuggestions = [
  { title: "Explain this code", prompt: "Explain this code snippet:\n```javascript\n\n```" },
  { title: "Write a function", prompt: "Write a TypeScript function that sorts an array of objects by a specific key." },
  { title: "Debug my code", prompt: "I'm getting a 'Cannot read properties of undefined' error, can you help me debug it?\n```\n\n```" },
  { title: "How do I use...", prompt: "How do I use the `async/await` syntax in JavaScript?" },
  { title: "Optimize this query", prompt: "Can you optimize this SQL query for better performance?\n```sql\n\n```" },
  { title: "CSS Flexbox help", prompt: "How can I center a div both vertically and horizontally using CSS Flexbox?" },
  { title: "Python list comprehension", prompt: "Show me an example of a Python list comprehension to filter even numbers." },
  { title: "Generate a regex", prompt: "Write a regular expression to validate an email address." },
  { title: "Refactor to React Hooks", prompt: "Help me refactor this React class component to use functional components and hooks.\n```javascript\n\n```" },
  { title: "What's the difference?", prompt: "What's the difference between `let`, `const`, and `var` in JavaScript?" },
  { title: "API fetch example", prompt: "Provide an example of fetching data from an API using the `fetch` function in JavaScript." },
  { title: "Create a simple test", prompt: "Write a simple unit test for a function that adds two numbers using Jest." }
];

// Function to shuffle an array and pick N items
const getRandomSuggestions = (count: number) => {
    const shuffled = [...allSuggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onSelectSuggestion }) => {
  const [suggestions, setSuggestions] = useState<{title: string, prompt: string}[]>([]);

  useEffect(() => {
    // Select 4 random suggestions when the component mounts
    setSuggestions(getRandomSuggestions(4));
  }, []);

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