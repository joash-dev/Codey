import React from 'react';
import { Message } from '../types';
import CodeSnippet from './CodeSnippet';
import { AiSparkIcon, UserIcon } from './Icons';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  const parseResponse = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const codeBlock = part.replace(/```/g, '').trim();
        const firstLine = codeBlock.split('\n')[0];
        const isLangSpecified = /^[a-z]+$/.test(firstLine);
        const language = isLangSpecified ? firstLine : '';
        const actualCode = isLangSpecified
          ? codeBlock.substring(language.length).trim()
          : codeBlock;
        return (
          <CodeSnippet key={index} language={language}>
            {actualCode}
          </CodeSnippet>
        );
      }
      const withFormatting = part
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

      return <div key={index} className="whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: withFormatting }} />;
    });
  };

  const TypingIndicator = () => (
    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-lg border border-white/10 rounded-lg px-3 py-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
    </div>
  );
  
  const AiAvatar = () => (
    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 self-start">
        <AiSparkIcon />
    </div>
  )

  const UserAvatar = () => (
    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-white/10 self-start backdrop-blur-lg border border-white/10">
        <UserIcon />
    </div>
  );

  if (isUser) {
    return (
        <div className="flex justify-end items-start gap-3">
            <div className="px-4 py-2 rounded-t-lg rounded-bl-lg max-w-lg bg-white/10 backdrop-blur-lg border border-white/10 text-gray-200 prose prose-invert prose-p:my-0">
                {parseResponse(message.text)}
            </div>
            <UserAvatar />
        </div>
    );
  }

  // AI Message
  if (message.sender === 'ai' && message.text === '') {
    return (
        <div className="flex justify-start items-center gap-3">
            <AiAvatar />
            <TypingIndicator />
        </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 justify-start`}>
      <AiAvatar />
      <div
        className={`px-4 py-2 rounded-t-lg rounded-br-lg max-w-lg bg-gradient-to-br from-purple-600/30 to-pink-500/30 backdrop-blur-lg border border-white/10 text-white prose prose-invert prose-p:my-0`}
      >
        {parseResponse(message.text)}
      </div>
    </div>
  );
};

export default MessageBubble;