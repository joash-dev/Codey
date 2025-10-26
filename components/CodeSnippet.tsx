import React, { useRef, useEffect, useState } from 'react';
import { CopyIcon, CheckIcon } from './Icons';

declare global {
    interface Window {
      hljs: any;
    }
}

interface CodeSnippetProps {
    language: string;
    children: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ language, children }) => {
    const codeRef = useRef<HTMLElement>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (codeRef.current && window.hljs) {
            window.hljs.highlightElement(codeRef.current);
        }
    }, [children]);

    const handleCopy = () => {
        if (!children) return;
        navigator.clipboard.writeText(children).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <div className="bg-black/30 rounded-lg my-2 overflow-hidden border border-white/10 relative group backdrop-blur-sm">
            <div className="bg-black/20 px-4 py-1.5 text-xs text-gray-400 font-sans flex justify-between items-center">
                <span>{language || 'code'}</span>
                <button 
                    onClick={handleCopy} 
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs focus:outline-none"
                    aria-label="Copy code"
                >
                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="text-sm text-gray-200 overflow-x-auto">
                <code ref={codeRef} className={`language-${language} p-4 block`}>
                    {children}
                </code>
            </pre>
        </div>
    );
};

export default CodeSnippet;