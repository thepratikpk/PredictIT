import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Trash2, 
  User, 
  Bot,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

interface ChatPanelProps {
  isCollapsed?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isCollapsed = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { isAuthenticated } = useAuthStore();
  const {
    currentSessionId,
    messages,
    sessions,
    isLoading,
    setCurrentSession,
    addMessage,
    loadChatSessions,
    saveMessage,
    deleteSession,
    clearCurrentChat,
    generateSessionId
  } = useChatStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadChatSessions();
    }
  }, [isAuthenticated, loadChatSessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isAuthenticated) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = generateSessionId();
      setCurrentSession(sessionId);
    }

    // Add user message to UI immediately
    addMessage({
      session_id: sessionId,
      message: inputMessage,
      message_type: 'user'
    });

    // Save user message to backend
    await saveMessage(sessionId, inputMessage, 'user');

    const userMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(async () => {
      const aiResponse = generateAIResponse(userMessage);
      
      addMessage({
        session_id: sessionId,
        message: aiResponse,
        message_type: 'assistant'
      });

      await saveMessage(sessionId, aiResponse, 'assistant');
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('upload') || message.includes('data')) {
      return "To upload your dataset, go to Step 1 in the pipeline builder. I support CSV and Excel files. Make sure your data has clear column headers and is properly formatted.";
    } else if (message.includes('model') || message.includes('algorithm')) {
      return "I support Logistic Regression and Decision Tree models. Logistic Regression works well for binary classification, while Decision Trees are great for interpretable results. Which type of problem are you trying to solve?";
    } else if (message.includes('preprocess') || message.includes('scaling')) {
      return "For preprocessing, I offer StandardScaler (mean=0, std=1) and MinMaxScaler (0-1 range). StandardScaler is good for normally distributed data, while MinMaxScaler works well when you want to preserve relationships between features.";
    } else if (message.includes('accuracy') || message.includes('performance')) {
      return "Model performance depends on your data quality and the problem complexity. Generally, 80%+ accuracy is good for most classification tasks. I'll show you accuracy metrics and confusion matrix after training.";
    } else if (message.includes('help') || message.includes('how')) {
      return "I'm here to help you build ML models! You can ask me about:\n• Data upload and formatting\n• Preprocessing options\n• Model selection\n• Performance interpretation\n\nWhat would you like to know?";
    } else {
      return "I understand you're working on your ML pipeline. Could you be more specific about what you need help with? I can assist with data upload, preprocessing, model selection, or interpreting results.";
    }
  };

  const handleNewChat = () => {
    clearCurrentChat();
    setIsExpanded(true);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this chat session?')) {
      await deleteSession(sessionId);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isCollapsed) {
    return (
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 border-t border-gray-200">
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">
              Sign in to access AI chat assistance
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200">
      {/* Chat Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">AI Assistant</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="p-1 h-auto text-gray-400 hover:text-gray-600"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-auto text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Chat Sessions */}
        {!isExpanded && sessions.length > 0 && (
          <div className="space-y-1 mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Recent Chats</p>
            {sessions.slice(0, 3).map((session) => (
              <div
                key={session.session_id}
                className={`group cursor-pointer rounded p-2 text-xs transition-colors ${
                  currentSessionId === session.session_id
                    ? 'bg-slate-50 border border-slate-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setCurrentSession(session.session_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 truncate font-medium">
                      {session.last_message.substring(0, 30)}...
                    </p>
                    <p className="text-gray-500">
                      {formatTime(session.last_timestamp)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-gray-400 hover:text-red-500"
                    onClick={(e) => handleDeleteSession(session.session_id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Chat Interface */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  Hi! I'm your ML assistant. Ask me anything about building your pipeline.
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.message_type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.message_type === 'assistant' && (
                  <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.message_type === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.message_type === 'user' ? 'text-slate-300' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {message.message_type === 'user' && (
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about your ML pipeline..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white px-3"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};