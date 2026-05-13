import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sprout, CloudRain, ShieldAlert, MoreHorizontal, Mic, Play, Square } from 'lucide-react';
import { chatWithAI, voiceChat } from '../services/api';
import { voiceService } from '../services/voiceService';
import { useTranslation } from 'react-i18next';

export default function AIAssistant() {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello Farmer! I am your Krishi AI Advisor. I have analyzed your farm\'s recent data. How can I help you optimize your yield today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [farmData, setFarmData] = useState({ city: 'Kolkata', soil: 'Alluvial' });
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check voice availability
  useEffect(() => {
    setVoiceAvailable(voiceService.isAvailable());
  }, []);

  // Set language for voice recognition
  useEffect(() => {
    voiceService.setLanguage(i18n.language);
  }, [i18n.language]);

  // Get farm data from session/localStorage (set by Dashboard)
  useEffect(() => {
    const savedCity = localStorage.getItem('farmCity') || 'Kolkata';
    const savedSoil = localStorage.getItem('farmSoil') || 'Alluvial';
    setFarmData({ city: savedCity, soil: savedSoil });
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Call backend API to get actual chat response with current language
      const result = await chatWithAI(input, farmData.city, farmData.soil, i18n.language);
      
      let aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: result?.response || 'Unable to generate recommendation. Please try again.'
      };
      
      setMessages((prev) => [...prev, aiResponse]);

      // Auto-speak AI response using Web Speech Synthesis API (Zero Latency)
      if (voiceService.isSynthesisAvailable()) {
        await voiceService.speakReply(aiResponse.text);
      }
    } catch (err) {
      console.error('API Error:', err);
      const errorResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Sorry, I couldn\'t connect to the server. Please make sure the backend is running and try again.'
      };
      setMessages((prev) => [...prev, errorResponse]);

      // Also speak error response
      if (voiceService.isSynthesisAvailable()) {
        await voiceService.speakReply(errorResponse.text);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!voiceService.isAvailable()) {
      alert('Voice recognition is not available in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setInterimTranscript('');

    voiceService.startListening(
      (result) => {
        if (result.final) {
          setInput(result.final);
        }
        setInterimTranscript(result.interim);
      },
      (error) => {
        console.error('🎤 Voice error:', error);
        setIsListening(false);
        
        // Provide specific error messages
        const errorMessages = {
          'no-speech': 'No speech detected. Please speak clearly into your microphone and try again.',
          'audio-capture': 'Cannot access microphone. Please check if the microphone is connected and allowed.',
          'network': 'Network error. Please check your internet connection.',
          'not-allowed': 'Microphone access denied. Please allow microphone access in your browser settings.',
          'service-not-allowed': 'Speech recognition service is not allowed. Please check your browser settings.'
        };
        
        const message = errorMessages[error] || `Voice recognition error: ${error}. Try speaking again.`;
        alert(message);
      },
      async (finalTranscript) => {
        setIsListening(false);
        
        // Don't submit here - let onSilence callback handle it
        // This prevents duplicate submissions
      },
      // onSilence callback - triggered after 4 seconds of silence
      async (silentText) => {
        console.log('🤐 Silence detected! Auto-submitting:', silentText);
        
        if (!silentText.trim()) {
          alert('No speech was detected. Please make sure your microphone is working and try again.');
          return;
        }

        await submitVoiceQuery(silentText);
      }
    );
  };

  const submitVoiceQuery = async (queryText) => {
    setInput(queryText);
    
    // Add user message
    const userMessage = { id: Date.now(), sender: 'user', text: queryText };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const result = await voiceChat(queryText, farmData.city, farmData.soil, i18n.language);
      
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: result?.text || 'Unable to generate recommendation. Please try again.',
        audio: result?.audio
      };
      
      setMessages((prev) => [...prev, aiResponse]);
      
      // Auto-play audio response if available (from server)
      if (result?.audio) {
        setIsPlayingAudio(true);
        try {
          console.log('🔊 Auto-playing AI response from server...');
          await voiceService.playAudio(result.audio);
          console.log('✅ Response audio finished playing');
        } catch (audioError) {
          console.error('Error playing audio:', audioError);
          // Fallback to Web Speech Synthesis if audio playback fails
          if (voiceService.isSynthesisAvailable()) {
            await voiceService.speakReply(aiResponse.text);
          }
        } finally {
          setIsPlayingAudio(false);
        }
      } else if (voiceService.isSynthesisAvailable()) {
        // Use Web Speech Synthesis as fallback (Zero Latency)
        await voiceService.speakReply(aiResponse.text);
      }
    } catch (err) {
      console.error('Voice chat error:', err);
      const errorResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Sorry, I couldn\'t process your voice. Please try again or type your message.'
      };
      setMessages((prev) => [...prev, errorResponse]);

      // Speak error response
      if (voiceService.isSynthesisAvailable()) {
        await voiceService.speakReply(errorResponse.text);
      }
    } finally {
      setIsTyping(false);
      setInput('');
    }
  };

  const playAudioMessage = async (audioHex) => {
    if (isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    try {
      await voiceService.playAudio(audioHex);
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Failed to play audio');
    } finally {
      setIsPlayingAudio(false);
    }
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
              
              {msg.audio && msg.sender === 'ai' && (
                <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                  <button 
                    onClick={() => playAudioMessage(msg.audio)}
                    disabled={isPlayingAudio}
                    className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 rounded-full transition-all"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Square size={12} className="fill-current" /> Playing...
                      </>
                    ) : (
                      <>
                        <Play size={12} className="fill-current" /> Listen
                      </>
                    )}
                  </button>
                </div>
              )}
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
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-3 uppercase tracking-wider">Suggested Questions for {farmData.city}</p>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: <Sprout size={14}/>, text: "What crops should I grow?" },
              { icon: <CloudRain size={14}/>, text: "Should I water today?" },
              { icon: <ShieldAlert size={14}/>, text: "What's your recommendation based on my farm?" }
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
      {isListening && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="font-medium mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2">
              🎤 Listening... (speaking now)
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2"></span>
            </p>
            {interimTranscript && (
              <p className="italic text-sm text-blue-600 dark:text-blue-400">
                "{interimTranscript}"
              </p>
            )}
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
              {!interimTranscript 
                ? '💬 Waiting for speech... (speak clearly and loudly)' 
                : '✅ Speech detected! Stop talking to auto-submit (or wait 4 seconds)'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-pulse" style={{ width: '100%' }}></div>
              </div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Auto-submit in 4s</span>
            </div>
          </div>
        )}

        {/* Text-to-Speech Controls */}
        {voiceService.getSpeakingStatus() && (
          <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                🔊 AI is speaking...
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => voiceService.pauseSpeech()}
                  className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors text-xs font-semibold"
                  title="Pause speech"
                >
                  ⏸️ Pause
                </button>
                <button
                  type="button"
                  onClick={() => voiceService.resumeSpeech()}
                  className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors text-xs font-semibold"
                  title="Resume speech"
                >
                  ▶️ Resume
                </button>
                <button
                  type="button"
                  onClick={() => voiceService.stopSpeech()}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors text-xs font-semibold"
                  title="Stop speech"
                >
                  🛑 Stop
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="relative flex items-center gap-2">
          <button 
            type="button"
            onClick={handleVoiceInput}
            disabled={!voiceAvailable || isTyping}
            className={`p-3 rounded-full transition-colors shrink-0 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                : 'bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-300 dark:disabled:bg-slate-700 text-white'
            }`}
            title={voiceAvailable ? (isListening ? 'Stop listening (or wait for auto-submit)' : 'Click to speak - auto-submits after 4 seconds of silence') : 'Voice not available'}
          >
            {isListening ? <Square size={18} className="fill-white" /> : <Mic size={18} />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isTyping) {
                e.preventDefault();
              }
            }}
            placeholder={isListening ? 'Listening - speak clearly...' : 'Message Krishi AI or use voice...'}
            disabled={isListening}
            className="flex-1 bg-neutral-100 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 text-neutral-800 dark:text-neutral-100 rounded-full py-3 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isListening || isTyping}
            className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 dark:disabled:bg-slate-700 text-white rounded-full transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
