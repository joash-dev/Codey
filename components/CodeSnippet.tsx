import React, { useRef, useEffect, useState } from 'react';
import { CopyIcon, CheckIcon, MagicWandIcon, SpinnerIcon, LightbulbIcon, XIcon } from './Icons';

declare global {
    interface Window {
      hljs: any;
      Diff: {
        diffLines: (oldStr: string, newStr: string) => DiffResult[];
      };
    }
}

interface DiffResult {
    value: string;
    added?: boolean;
    removed?: boolean;
}

interface CodeSnippetProps {
    language: string;
    children: string;
    onRefactorCode?: (code: string) => Promise<string>;
    onExplainCode?: (code: string, language: string) => Promise<string>;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ language, children, onRefactorCode, onExplainCode }) => {
    const codeRef = useRef<HTMLElement>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isRefactoring, setIsRefactoring] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [diffResult, setDiffResult] = useState<DiffResult[]>([]);
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        if (codeRef.current && window.hljs && !showDiff) {
            window.hljs.highlightElement(codeRef.current);
        }
    }, [children, showDiff]);

    const handleCopy = () => {
        if (!children) return;
        navigator.clipboard.writeText(children).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const handleRefactor = async () => {
        if (!onRefactorCode || !children) return;
        setIsRefactoring(true);
        setShowDiff(false);
        try {
            const refactoredCode = await onRefactorCode(children);
            if (refactoredCode.trim() !== children.trim()) {
                const diff = window.Diff.diffLines(children, refactoredCode);
                setDiffResult(diff);
                setShowDiff(true);
            }
        } catch (error) {
            console.error("Refactor failed:", error);
        } finally {
            setIsRefactoring(false);
        }
    };

    const handleExplain = async () => {
        if (!onExplainCode || !children) return;
        setIsExplaining(true);
        setExplanation(null);
        try {
            const result = await onExplainCode(children, language);
            setExplanation(result);
            setShowExplanation(true);
        } catch (error) {
            console.error("Explain failed:", error);
            setExplanation("Sorry, I couldn't explain this code.");
            setShowExplanation(true);
        } finally {
            setIsExplaining(false);
        }
      };

    const parseExplanation = (text: string) => {
        const withFormatting = text
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>');
        return <div className="whitespace-pre-wrap leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-2" dangerouslySetInnerHTML={{ __html: withFormatting }} />;
    };

    const DiffView = () => (
        <pre className="text-sm text-gray-200 overflow-x-auto p-4">
            <code>
                {diffResult.map((part, index) => {
                    const colorClass = part.added 
                        ? 'bg-green-500/20' 
                        : part.removed 
                        ? 'bg-red-500/20' 
                        : 'bg-transparent';
                    
                    const prefix = part.added ? '+' : part.removed ? '-' : ' ';

                    return (
                        <span key={index} className={`${colorClass} block`}>
                           <span className="select-none text-gray-500 mr-4">{prefix}</span>
                           {part.value.endsWith('\n') ? part.value.slice(0, -1) : part.value}
                        </span>
                    )
                })}
            </code>
        </pre>
    );

    return (
        <div className="bg-black/30 rounded-lg my-2 overflow-hidden border border-white/10 relative group backdrop-blur-sm">
            <div className="bg-black/20 px-4 py-1.5 text-xs text-gray-400 flex justify-between items-center">
                <div className='flex items-center gap-4'>
                    <span>{language || 'code'}</span>
                    {showDiff && (
                        <button
                            onClick={() => setShowDiff(false)}
                            className="text-gray-400 hover:text-white transition-colors text-xs focus:outline-none"
                            aria-label="Show original code"
                        >
                            Show Original
                        </button>
                    )}
                </div>
                <div className='flex items-center gap-3'>
                    {onExplainCode && (
                        <button 
                            onClick={handleExplain}
                            disabled={isExplaining}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs focus:outline-none disabled:text-gray-600 disabled:cursor-wait"
                            aria-label="Explain code"
                        >
                            {isExplaining ? <SpinnerIcon /> : <LightbulbIcon />}
                            {isExplaining ? 'Thinking...' : 'Explain'}
                        </button>
                    )}
                    {onRefactorCode && (
                         <button 
                            onClick={handleRefactor}
                            disabled={isRefactoring}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs focus:outline-none disabled:text-gray-600 disabled:cursor-wait"
                            aria-label="Refactor code"
                        >
                            {isRefactoring ? <SpinnerIcon /> : <MagicWandIcon />}
                            {isRefactoring ? 'Refactoring...' : 'Refactor'}
                        </button>
                    )}
                    <button 
                        onClick={handleCopy} 
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs focus:outline-none"
                        aria-label="Copy code"
                    >
                        {isCopied ? <CheckIcon /> : <CopyIcon />}
                        {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
            {showDiff ? <DiffView /> : (
                 <pre className="text-sm text-gray-200 overflow-x-auto">
                    <code ref={codeRef} className={`language-${language} p-4 block`}>
                        {children}
                    </code>
                </pre>
            )}
            {showExplanation && explanation && (
                <div className="bg-black/20 p-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-white">Explanation</h4>
                        <button onClick={() => setShowExplanation(false)} className="p-1 rounded-full hover:bg-white/10" aria-label="Close explanation">
                            <XIcon />
                        </button>
                    </div>
                    <div className="text-gray-300">{parseExplanation(explanation)}</div>
                </div>
            )}
        </div>
    );
};

export default CodeSnippet;