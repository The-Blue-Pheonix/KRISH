/**
 * Voice Service for KRISHI AI
 * Handles speech recognition and audio playback
 */

class VoiceService {
  constructor() {
    // Initialize Web Speech API for Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.isListening = false;
    this.transcript = '';
    this.audioContext = null;
    this.recognitionTimeout = null;
    this.silenceTimeout = null;
    this.hasSpokenSomething = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.networkErrorOccurred = false;
    this.lastResultTime = 0;
    
    // Configure recognition with more robust settings
    this.recognition.continuous = true;  // Keep listening for longer
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-IN'; // Default to Indian English
    this.recognition.maxAlternatives = 1;

    // Initialize Web Speech Synthesis API for TTS
    this.synthesis = window.speechSynthesis;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.currentLanguage = 'en-IN';
    this.synthesisVoices = [];
    
    // Load available voices when they're ready
    if (this.synthesis) {
      this.synthesis.onvoiceschanged = () => {
        this.synthesisVoices = this.synthesis.getVoices();
        console.log(`[TTS] ${this.synthesisVoices.length} voices available`);
      };
      // Initial voice load
      this.synthesisVoices = this.synthesis.getVoices();
    }
  }

  /**
   * Request microphone permission and start listening
   */
  startListening(onResult, onError, onEnd, onSilence) {
    try {
      this.isListening = true;
      this.transcript = '';
      this.hasSpokenSomething = false;
      this.networkErrorOccurred = false;
      this.lastResultTime = Date.now();

      console.log('🎤 Initializing speech recognition...');

      this.recognition.onstart = () => {
        console.log('[Voice] Listening started - waiting for speech...');
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            this.hasSpokenSomething = true;
            console.log('[Voice] Final:', transcript);
          } else {
            interimTranscript += transcript;
            if (transcript.trim()) {
              this.hasSpokenSomething = true;
            }
          }
        }

        this.transcript = finalTranscript;
        this.lastResultTime = Date.now();

        // Reset network error flag on successful result
        this.networkErrorOccurred = false;

        // Callback with both final and interim results
        onResult({
          final: this.transcript.trim(),
          interim: interimTranscript,
          hasSpoken: this.hasSpokenSomething
        });

        // Clear any existing silence timeout and set new one
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
        }

        // Auto-submit after 4 seconds of silence
        this.silenceTimeout = setTimeout(() => {
          const timeSinceLastResult = Date.now() - this.lastResultTime;
          console.log(`[Voice] 4 seconds of silence detected (${timeSinceLastResult}ms)`);
          
          if (this.transcript.trim() && this.isListening) {
            console.log('[Voice] Auto-submitting text due to silence...');
            this.recognition.stop();
            this.isListening = false;
            
            if (onSilence) {
              onSilence(this.transcript.trim());
            }
          }
        }, 4000);

        // Reset no-speech timeout when we get results
        if (this.recognitionTimeout) {
          clearTimeout(this.recognitionTimeout);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('[Voice] Error:', event.error);
        
        // Handle specific error types
        switch (event.error) {
          case 'no-speech':
            console.warn('[Voice] No speech detected - make sure microphone is working and speak clearly');
            if (!this.hasSpokenSomething) {
              onError('No speech detected. Please speak clearly and try again.');
            }
            break;
          case 'audio-capture':
            onError('No microphone found. Please check your microphone is connected.');
            break;
          case 'network':
            this.networkErrorOccurred = true;
            console.warn(`[Voice] Network error (attempt ${this.retryCount + 1}/${this.maxRetries})`);
            
            if (this.retryCount < this.maxRetries) {
              this.retryCount++;
              console.log(`[Voice] Retrying in 2 seconds...`);
              setTimeout(() => {
                if (this.isListening) {
                  this.recognition.start();
                }
              }, 2000);
            } else {
              onError('Network error after multiple attempts. Please check your internet connection and try again.');
              this.isListening = false;
            }
            break;
          case 'not-allowed':
            onError('Microphone access denied. Please allow microphone access in browser settings.');
            break;
          default:
            onError(`Speech recognition error: ${event.error}`);
        }
        
        if (event.error !== 'network' || this.retryCount >= this.maxRetries) {
          this.isListening = false;
        }
      };

      this.recognition.onend = () => {
        console.log('[Voice] Recognition ended');
        
        // Clear all timeouts
        if (this.recognitionTimeout) {
          clearTimeout(this.recognitionTimeout);
        }
        if (this.silenceTimeout) {
          clearTimeout(this.silenceTimeout);
        }
        
        this.isListening = false;
        this.retryCount = 0;
        
        if (onEnd) {
          onEnd(this.transcript.trim());
        }
      };

      // Set a longer timeout for detecting speech (15 seconds for more robust detection)
      this.recognitionTimeout = setTimeout(() => {
        if (!this.hasSpokenSomething && this.isListening) {
          console.warn('[Voice] Timeout - no speech detected in 15 seconds');
          this.recognition.stop();
        }
      }, 15000);

      // Start recognition
      this.recognition.start();
      console.log('🎤 Speech recognition started - listening now...');
    } catch (error) {
      console.error('[Voice] Error starting recognition:', error);
      onError('Microphone access denied or not available. Please check browser permissions.');
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.isListening) {
      console.log('🛑 Stopping speech recognition');
      if (this.recognitionTimeout) {
        clearTimeout(this.recognitionTimeout);
      }
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Set language for speech recognition AND text-to-speech
   */
  setLanguage(languageCode) {
    const languageMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN'
    };
    
    const mappedLang = languageMap[languageCode] || 'en-IN';
    this.recognition.lang = mappedLang;
    this.currentLanguage = mappedLang;
    console.log(`[Voice] Language set to: ${mappedLang} (Speech Recognition & TTS)`);
  }

  /**
   * Play audio from base64 hex string
   */
  playAudio(audioHex) {
    return new Promise((resolve, reject) => {
      try {
        if (!audioHex) {
          reject(new Error('No audio data provided'));
          return;
        }

        // Convert hex string to bytes
        const bytes = new Uint8Array(audioHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        const audio = new Audio(url);
        
        audio.onended = () => {
          URL.revokeObjectURL(url);
          console.log('✅ Audio playback finished');
          resolve();
        };
        
        audio.onerror = (err) => {
          URL.revokeObjectURL(url);
          console.error('Audio playback error:', err);
          reject(new Error('Failed to play audio'));
        };
        
        console.log('▶️ Playing audio response...');
        audio.play().catch(err => {
          URL.revokeObjectURL(url);
          reject(err);
        });
      } catch (error) {
        console.error('Audio conversion error:', error);
        reject(error);
      }
    });
  }

  /**
   * Check if voice recognition is available
   */
  isAvailable() {
    const available = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    console.log(`[Voice] Recognition available: ${available}`);
    return available;
  }

  /**
   * Check if currently listening
   */
  getListeningStatus() {
    return this.isListening;
  }

  /**
   * ==================== TEXT-TO-SPEECH METHODS ====================
   * Using Web Speech Synthesis API for zero-latency voice responses
   */

  /**
   * Speak text using Web Speech Synthesis API
   * Zero latency - responds immediately without server processing
   * @param {string} text - The text to speak
   * @param {Function} onEnd - Callback when speech ends
   * @returns {Promise}
   */
  speakReply(text, onEnd) {
    return new Promise((resolve) => {
      if (!this.synthesis) {
        console.error('[TTS] Speech Synthesis not available');
        resolve();
        return;
      }

      try {
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        // Set voice based on language
        const voice = this.getVoiceForLanguage(this.currentLanguage);
        if (voice) {
          utterance.voice = voice;
        }

        // Configure speech properties
        utterance.pitch = 1.0; // Natural pitch
        utterance.rate = 0.95; // Slightly slower for clarity
        utterance.volume = 1.0; // Full volume
        utterance.lang = this.currentLanguage;

        // Event handlers
        utterance.onstart = () => {
          this.isSpeaking = true;
          console.log('[TTS] 🔊 Speaking started...');
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          console.log('[TTS] ✅ Speaking finished');
          if (onEnd) onEnd();
          resolve();
        };

        utterance.onerror = (event) => {
          this.isSpeaking = false;
          console.error('[TTS] Speech error:', event.error);
          if (onEnd) onEnd();
          resolve();
        };

        utterance.onpause = () => {
          console.log('[TTS] ⏸️ Speech paused');
        };

        utterance.onresume = () => {
          console.log('[TTS] ▶️ Speech resumed');
        };

        // Start speaking
        this.synthesis.speak(utterance);
        console.log('[TTS] Speaking:', text.substring(0, 50) + '...');
      } catch (error) {
        console.error('[TTS] Error during speech synthesis:', error);
        this.isSpeaking = false;
        resolve();
      }
    });
  }

  /**
   * Stop ongoing speech synthesis
   */
  stopSpeech() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      console.log('[TTS] 🛑 Speech stopped');
    }
  }

  /**
   * Pause ongoing speech
   */
  pauseSpeech() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.pause();
      console.log('[TTS] ⏸️ Speech paused');
    }
  }

  /**
   * Resume paused speech
   */
  resumeSpeech() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.resume();
      console.log('[TTS] ▶️ Speech resumed');
    }
  }

  /**
   * Get the appropriate voice for the current language
   * @param {string} languageCode - Language code like 'en-IN', 'hi-IN'
   * @returns {SpeechSynthesisVoice|null}
   */
  getVoiceForLanguage(languageCode) {
    if (!this.synthesisVoices || this.synthesisVoices.length === 0) {
      console.warn('[TTS] No voices available');
      return null;
    }

    const languageMap = {
      'en-IN': ['Google US English', 'English', 'en-US', 'en-IN'],
      'hi-IN': ['Hindi', 'hi-IN', 'hi'],
      'ta-IN': ['Tamil', 'ta-IN', 'ta'],
      'bn-IN': ['Bengali', 'bn-IN', 'bn'],
      'mr-IN': ['Marathi', 'mr-IN', 'mr'],
    };

    const preferredVoices = languageMap[languageCode] || ['English', 'en-US'];

    // Try to find a voice matching the preferred list
    for (let preferred of preferredVoices) {
      const voice = this.synthesisVoices.find(v => 
        v.name.includes(preferred) || 
        v.lang.includes(preferred.split('-')[0])
      );
      if (voice) {
        console.log(`[TTS] Selected voice: ${voice.name} (${voice.lang})`);
        return voice;
      }
    }

    // Fallback to first available voice
    const fallback = this.synthesisVoices[0];
    console.log(`[TTS] Using fallback voice: ${fallback?.name || 'default'}`);
    return fallback;
  }

  /**
   * Check if text-to-speech is available
   */
  isSynthesisAvailable() {
    return !!(window.speechSynthesis);
  }

  /**
   * Get current speech status
   */
  getSpeakingStatus() {
    return this.isSpeaking;
  }

  /**
   * Speak with detailed configuration options
   * @param {string} text - Text to speak
   * @param {Object} options - Configuration options
   * @param {number} options.rate - Speech rate (0.5-2, default: 0.95)
   * @param {number} options.pitch - Pitch level (0-2, default: 1)
   * @param {number} options.volume - Volume (0-1, default: 1)
   * @param {Function} options.onEnd - Callback when done
   */
  speakWithOptions(text, options = {}) {
    return new Promise((resolve) => {
      if (!this.synthesis) {
        console.error('[TTS] Speech Synthesis not available');
        resolve();
        return;
      }

      try {
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        // Apply options
        utterance.rate = options.rate || 0.95;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        utterance.lang = this.currentLanguage;

        const voice = this.getVoiceForLanguage(this.currentLanguage);
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
          this.isSpeaking = true;
          console.log('[TTS] 🔊 Speaking...');
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          console.log('[TTS] ✅ Speaking finished');
          if (options.onEnd) options.onEnd();
          resolve();
        };

        utterance.onerror = (event) => {
          this.isSpeaking = false;
          console.error('[TTS] Error:', event.error);
          if (options.onEnd) options.onEnd();
          resolve();
        };

        this.synthesis.speak(utterance);
      } catch (error) {
        console.error('[TTS] Error:', error);
        this.isSpeaking = false;
        resolve();
      }
    });
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
export default VoiceService;
