import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sprout, CloudRain, ShieldAlert, MoreHorizontal } from 'lucide-react';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello Farmer! I am your Krishi AI Advisor. I have analyzed your farm\'s recent data. How can I help you optimize your yield today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock API Response delay
    setTimeout(() => {
      const aiResponse = { 
        id: Date.now() + 1, 
        sender: 'ai', 
        text: 'This feature will be connected to the backend soon! For now, your crops are looking healthy. Wait for your backend team to hook up the endpoint!' 
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestion = (text) => {
    setInput(text);
  };

  return (
    <div className="flex flex-col h-[85vh] dashboard-card overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-neutral-200 dark:border-slate-700 p-4 flex items-center justify-between z-10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="font-bold text-neutral-900 dark:text-neutral-100 transition-colors">Krishi AI</h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 transition-colors">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
            </p>
          </div>
        </div>
        <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-2">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-neutral-50/50 dark:bg-slate-900/50 transition-colors">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.sender === 'user' 
                ? 'bg-neutral-800 dark:bg-neutral-600 text-white' 
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.sender === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-sm shadow-md' 
                : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-slate-700 rounded-bl-sm shadow-sm'
            } transition-colors`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 p-4 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-slate-500 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length < 3 && (
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-neutral-200 dark:border-slate-700 transition-colors">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-3 uppercase tracking-wider">Suggested Questions</p>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: <Sprout size={14}/>, text: "What's the best fertilizer for my current crop?" },
              { icon: <CloudRain size={14}/>, text: "Should I irrigate today based on the weather?" },
              { icon: <ShieldAlert size={14}/>, text: "How to prevent pest attacks this season?" }
            ].map((sug, i) => (
              <button 
                key={i} 
                onClick={() => handleSuggestion(sug.text)}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-100 dark:border-emerald-800/30"
              >
                {sug.icon} {sug.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-800 border-t border-neutral-200 dark:border-slate-700 transition-colors">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Krishi AI..."
            className="w-full bg-neutral-100 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 text-neutral-800 dark:text-neutral-100 rounded-full py-3 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 dark:disabled:bg-slate-700 text-white rounded-full transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
