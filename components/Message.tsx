import React from 'react';
import { Message as MessageType } from '../types';
import { FileIcon } from './Icons';
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
        const applyInlineMarkdown = (text: string) => {
          return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
        };

        let html = part;

        // Process block-level elements first
        // HR
        html = html.replace(/^\s*---\s*$/gm, '<hr class="border-white/20">');
        
        // Headings
        html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Lists (unordered and ordered)
        const processList = (match: string): string => {
            const listType = match.match(/^\s*\d+\. /) ? 'ol' : 'ul';
            const items = match.trim().split('\n').map(item => {
                const content = item.replace(/^\s*([*+-]|\d+\.) /, '');
                return `<li>${applyInlineMarkdown(content)}</li>`;
            }).join('');
            return `<${listType}>${items}</${listType}>`;
        };
        
        const listBlocks: string[] = [];
        // Extract and process lists, replacing with placeholders
        html = html.replace(/^(?:\s*[-*+] .*(?:\n|$))+/gm, (match) => {
            listBlocks.push(processList(match));
            return `__LIST_PLACEHOLDER_${listBlocks.length - 1}__`;
        });
        html = html.replace(/^(?:\s*\d+\. .*(?:\n|$))+/gm, (match) => {
            listBlocks.push(processList(match));
            return `__LIST_PLACEHOLDER_${listBlocks.length - 1}__`;
        });
        
        // Process inline markdown on remaining text
        html = applyInlineMarkdown(html);

        // Restore lists
        html = html.replace(/__LIST_PLACEHOLDER_(\d+)__/g, (_, i) => listBlocks[parseInt(i)]);

        return <div key={index} className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html }} />;
      }
    }).filter(Boolean); // Filter out null parts
  };

  const bubbleClasses = isUser
    ? "bg-black/10"
    : "bg-white/5";
  const alignmentClasses = isUser ? "justify-end" : "justify-start";

  return (
    <div className={`flex ${alignmentClasses}`}>
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
    </div>
  );
};

export default MessageBubble;