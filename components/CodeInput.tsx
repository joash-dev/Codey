import React, { useState, useRef, useEffect, useCallback } from 'react';
import ActionButton from './ActionButton';
import { SendIcon, PaperclipIcon, XIcon, MicrophoneIcon, SpinnerIcon, FileIcon } from './Icons';
import { UploadedFile } from '../types';
import { getAutocompleteSuggestion } from '../services/geminiService';

interface CodeInputProps {
  onSendMessage: (message: string, file?: UploadedFile) => void;
  isLoading: boolean;
  initialValue?: string;
}

const CodeInput: React.FC<CodeInputProps> = ({ onSendMessage, isLoading, initialValue }) => {
  const [input, setInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialValue) {
        setInput(initialValue);
        textareaRef.current?.focus();
    }
  }, [initialValue]);

  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(resizeTextarea, [input]);
  
  const fetchSuggestion = useCallback(async (text: string) => {
    if (text.length < 5 || text.endsWith(' ')) {
        setSuggestion('');
        return;
    }
    try {
        const result = await getAutocompleteSuggestion(text);
        if (result && !text.endsWith(result)) {
            setSuggestion(result);
        } else {
            setSuggestion('');
        }
    } catch (error) {
        console.error("Autocomplete error:", error);
        setSuggestion('');
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
        if (input) {
            fetchSuggestion(input);
        } else {
            setSuggestion('');
        }
    }, 500); // 500ms debounce

    return () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
    };
  }, [input, fetchSuggestion]);


  useEffect(() => {
    // Fix: Cast window to `any` to access non-standard `SpeechRecognition` and `webkitSpeechRecognition` properties.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev.trim() + ' ' : '') + transcript);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
        textareaRef.current?.focus();
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech Recognition API is not supported in this browser.');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFile({
          name: file.name,
          content: reader.result as string,
          type: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if ((input.trim() || uploadedFile) && !isLoading) {
      onSendMessage(input, uploadedFile || undefined);
      setInput('');
      setUploadedFile(null);
      setSuggestion('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        setInput(input + suggestion);
        setSuggestion('');
        return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
    }
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        setSuggestion('');
        recognitionRef.current.start();
      } catch (err) {
        console.error("Could not start voice recognition:", err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setSuggestion('');
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="relative max-w-4xl mx-auto">
        {uploadedFile && (
            <div className="p-2 mb-2 bg-white/5 border border-white/10 rounded-lg w-fit">
                <div className="relative">
                    {uploadedFile.type.startsWith('image/') ? (
                        <img src={uploadedFile.content} alt="upload preview" className="max-h-32 rounded-md" />
                    ): (
                        <div className="flex items-center gap-3 p-2 pr-4 rounded-md bg-black/20 max-w-xs">
                            <div className="flex-shrink-0 text-white"><FileIcon /></div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-gray-200 truncate">{uploadedFile.name}</span>
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Remove file"
                        >
                        <XIcon />
                    </button>
                </div>
            </div>
        )}
        <div className="relative">
            <div 
              ref={suggestionRef}
              className="absolute inset-0 p-4 pl-20 sm:pl-24 pr-12 sm:pr-14 text-gray-500 pointer-events-none whitespace-pre-wrap"
              style={{
                fontFamily: textareaRef.current?.style.fontFamily,
                fontSize: textareaRef.current?.style.fontSize,
                lineHeight: textareaRef.current?.style.lineHeight,
                height: textareaRef.current?.clientHeight ? `${textareaRef.current?.clientHeight}px` : 'auto',
              }}
            >
                <span className="invisible">{input}</span>{suggestion}
            </div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Codey anything, attach a file, or use the mic..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-20 sm:pl-24 pr-12 sm:pr-14 text-white placeholder-gray-500 resize-none overflow-y-hidden focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))] transition-all caret-white"
              rows={1}
              disabled={isLoading || isRecording}
              style={{ background: 'transparent' }} 
            />
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="absolute left-3 bottom-3 flex items-center gap-2">
            <ActionButton onClick={() => fileInputRef.current?.click()} disabled={isLoading || isRecording} ariaLabel="Attach file">
                <PaperclipIcon />
            </ActionButton>
            <ActionButton onClick={handleVoiceInput} disabled={isLoading || isRecording || !recognitionRef.current} ariaLabel="Record message">
                {isRecording ? <SpinnerIcon /> : <MicrophoneIcon />}
            </ActionButton>
        </div>
        <div className="absolute right-3 bottom-3">
            <ActionButton onClick={handleSubmit} disabled={(!input.trim() && !uploadedFile) || isLoading} ariaLabel="Send message">
                <SendIcon />
            </ActionButton>
        </div>
      </div>
    </form>
  );
};

export default CodeInput;