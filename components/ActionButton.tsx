import React from 'react';

interface ActionButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>) => void;
  disabled: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, children, ariaLabel }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-full h-8 w-8 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))] border border-white/10"
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default ActionButton;