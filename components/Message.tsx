import React from 'react';
import { Message as MessageType } from '../types';
import { AiSparkIcon, UserIcon, FileIcon } from './Icons';
import CodeSnippet from './CodeSnippet';

interface MessageBubbleProps {
  message: MessageType;
  onRefactorCode?: (code: string) => Promise<string>;
  onExplainCode?: (code: string, language: string) => Promise<string>;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRefactorCode, onExplainCode }) => {
  const { sender, text, file } = message;
  const isUser = sender === 'user';

  // This function parses the text and renders code blocks using CodeSnippet
  // and other text with basic markdown formatting.
  const renderContent = (rawText: string) => {
    if (!rawText && sender === 'ai') {
        return (
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
        );
    }

    // Split text by code blocks, but keep the code blocks
    const parts = rawText.split(/(```[\w-]*\n[\s\S]*?\n```)/g);

    return parts.map((part, index) => {
      if (!part) return null;
      
      const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)\n```/;
      const match = part.match(codeBlockRegex);

      if (match) {
        const language = match[1] || 'plaintext';
        const code = match[2].trim();
        return <CodeSnippet key={index} language={language} onRefactorCode={onRefactorCode} onExplainCode={onExplainCode}>{code}</CodeSnippet>;
      } else {
        // Basic markdown support for bold, italic, and inline code.
        const withFormatting = part
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code class="bg-black/50 text-white/80 px-1 py-0.5 rounded-sm">$1</code>');

        return <div key={index} className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: withFormatting }} />;
      }
    }).filter(Boolean); // Filter out null parts
  };

  const Icon = isUser ? UserIcon : AiSparkIcon;
  const bubbleClasses = isUser
    ? "bg-black/10"
    : "bg-white/5";
  const alignmentClasses = isUser ? "justify-end" : "justify-start";

  return (
    <div className={`flex items-start gap-2 sm:gap-3 md:gap-4 ${alignmentClasses}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--accent-500))] to-[hsl(var(--accent-600))] flex items-center justify-center border-2 border-white/20 shadow-lg">
          <Icon />
        </div>
      )}
      <div className={`max-w-full md:max-w-3xl w-fit rounded-2xl p-3 sm:p-4 ${bubbleClasses}`}>
        {file && (
            <div className="mb-2">
                {file.type.startsWith('image/') ? (
                    <img src={file.content} alt={file.name} className="max-w-xs max-h-64 rounded-lg border border-white/10" />
                ) : (
                    <div className="flex items-center gap-3 p-2 pr-4 rounded-md bg-black/20 max-w-xs border border-white/10">
                        <div className="flex-shrink-0 text-white"><FileIcon /></div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-gray-200 truncate">{file.name}</span>
                        </div>
                    </div>
                )}
            </div>
        )}
        <div className="text-gray-200 leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-2">
            {renderContent(text)}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20">
          <Icon />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;