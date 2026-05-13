/**
 * Voice Service for KRISHI AI
 * Handles speech recognition and audio playback
 */

class VoiceService {
  constructor() {
    // Initialize Web Speech API
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
   * Set language for speech recognition
   */
  setLanguage(languageCode) {
    const languageMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN'
    };
    
    this.recognition.lang = languageMap[languageCode] || 'en-IN';
    console.log(`[Voice] Language set to: ${this.recognition.lang}`);
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
}

// Export singleton instance
export const voiceService = new VoiceService();
export default VoiceService;
