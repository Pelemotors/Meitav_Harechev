import React from 'react';
import ChatInterface from './ChatInterface';

interface ChatPanelProps {
  className?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ className = '' }) => {
  return (
    <div className={`h-full ${className}`}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">עוזר AI</h2>
        <p className="text-gray-600">
          שאל שאלות על רכבי יוקרה, מכירות, לידים, ונתונים עסקיים. 
          העוזר יכול לעזור בניתוח נתונים, מתן המלצות, ועזרה בניהול העסק.
        </p>
      </div>
      
      <div className="h-[calc(100vh-200px)]">
        <ChatInterface />
      </div>
    </div>
  );
};

export default ChatPanel;
