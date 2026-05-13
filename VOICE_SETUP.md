# 🎤 KRISHI AI Voice Chat - Setup & Troubleshooting

## ✅ Setup Requirements

### Backend Setup
1. **Install ElevenLabs SDK:**
   ```bash
   pip install elevenlabs>=0.2.27
   ```

2. **Add Environment Variables** to `.env`:
   ```
   ELEVENLABS_API_KEY=sk_2539510e7cd4b5e14de8bc79d3877d9b8b75a281476ae510
   PLANTNET_API_KEY=your_key
   GROQ_API_KEY=your_key
   ```

3. **Start Backend Server:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

### Frontend Setup
- No additional installation needed (uses native Web Speech API + ElevenLabs API)
- Requires modern browser with speech recognition support

---

## 🌐 Browser Compatibility

| Browser | Voice Input | Voice Output | Status |
|---------|-------------|--------------|--------|
| **Chrome/Chromium** | ✅ | ✅ | **BEST** |
| **Edge** | ✅ | ✅ | **BEST** |
| **Safari** | ✅ | ✅ | Good (iOS 14+) |
| **Firefox** | ⚠️ Partial | ✅ | Limited |
| **Opera** | ✅ | ✅ | Good |

---

## 🔧 Common Issues & Solutions

### 1. **Network Error - "Network error. Please check your internet connection"**

**What it means:** Browser can't reach Google's speech recognition servers

**Causes:**
- Internet connection is slow/unstable
- Firewall/VPN blocking Google servers
- Browser needs fresh page load
- Region restrictions (some countries block access)

**Solutions:**
- ✅ Check your internet connection
- ✅ Disable VPN if using one temporarily
- ✅ Try a different WiFi network (mobile hotspot instead of home WiFi)
- ✅ Refresh the page (`F5` or `Ctrl+R`)
- ✅ Clear browser cache: Settings → Privacy → Clear browsing data
- ✅ Wait a few seconds and try again (auto-retry enabled, up to 3 times)
- ✅ Try Chrome/Edge if using Firefox/Safari

**If network error persists:**
- Use **text input** instead (blue send button)
- Check if websites like Google.com work
- Contact your internet provider if all sites are slow

---

### 2. **No Speech Detected - "No speech detected. Please speak clearly"**

**What it means:** Microphone detected but no audio input captured

**Causes:**
- Microphone isn't working
- Speaking too quietly
- Microphone privacy is disabled
- Background noise too high

**Solutions:**
- ✅ Check microphone is connected and working
- ✅ Test microphone in another app first (voice call, recording app)
- ✅ Speak **louder and closer** to microphone
- ✅ Reduce background noise
- ✅ Check browser microphone permission:
  - Click settings icon in address bar
  - Look for microphone icon
  - Click "Allow"
- ✅ Reset microphone permission and try again

---

### 3. **Microphone Access Denied - "Microphone access denied"**

**What it means:** Browser doesn't have permission to use microphone

**Solutions:**
- ✅ **Chrome/Edge:**
  1. Click settings icon in address bar
  2. Find microphone icon
  3. Click dropdown → "Allow"
  4. Refresh page and try again

- ✅ **Safari (Mac):**
  1. System Preferences → Security & Privacy
  2. Microphone tab
  3. Check Safari is in the list and enabled

- ✅ **Windows 10/11:**
  1. Settings → Privacy & Security → Microphone
  2. Toggle "Microphone" ON
  3. Scroll down and enable for "(your browser)"

---

### 4. **No Microphone Found - "No microphone found"**

**What it means:** No audio input device detected

**Solutions:**
- ✅ Check microphone is plugged in (USB/headphones)
- ✅ Test microphone in system settings
- ✅ Try different microphone/headset
- ✅ Restart browser completely
- ✅ Restart computer if issue persists

---

### 5. **Audio Not Playing - "Failed to play audio"**

**What it means:** AI response was generated but audio playback failed

**Solutions:**
- ✅ Check browser volume settings
- ✅ Check speakers are connected/working
- ✅ Refresh page
- ✅ Try clicking "Listen" button again on the message
- ✅ Check if sound works in other apps/videos

---

## 📱 Using Voice Chat

### Step-by-Step:

1. **Click the blue 🎤 microphone button**
   - Button turns red when listening
   - Red pulse indicator shows active listening

2. **Speak your question clearly**
   - "What crops can I grow?"
   - "When should I water my fields?"
   - "How do I fight crop disease?"

3. **Wait for recognition to finish**
   - You'll see interim text appearing as you speak
   - Button will auto-stop after silence or 15 seconds
   - Or click red button to stop early

4. **AI processes and responds**
   - You'll see the AI's text response
   - Audio plays automatically (if available)
   - You can also click "Listen" to replay

5. **Continue conversation**
   - Ask follow-up questions using voice or text
   - Both methods work together seamlessly

---

## 🎯 Tips for Best Results

### Microphone Tips:
- 📍 Speak **directly into microphone** (not sideways)
- 🔆 **Clear, loud voice** - like talking to someone far away
- 🤫 **Minimize background noise** - close windows, pause music
- ⏱️ **Natural pace** - don't rush, normal speech is fine
- ⏳ **Wait 1 second before speaking** - give app time to start listening

### Network Tips:
- 🌐 Use **WiFi instead of mobile data** if available
- 📶 Move closer to WiFi router
- 🔌 Close other apps using internet
- 🕐 Try during off-peak hours (less network congestion)

### Browser Tips:
- 🔄 Refresh page if having issues
- 🌐 Use **Chrome or Edge** (best voice support)
- 🔇 Check browser isn't muted (check taskbar speaker icon)
- 🔐 Allow microphone in **all browser prompts**

---

## 🐛 Debug Information

If issues persist, check browser console for detailed logs:

1. Press **F12** to open Developer Tools
2. Go to **Console** tab
3. Look for messages starting with `[Voice]` or `🎤`
4. Share these logs if reporting issues

Example debug messages:
```
🎤 Initializing speech recognition...
[Voice] Listening started - waiting for speech...
[Voice] Final: What crops should I grow
✅ Audio playback finished
```

---

## 📞 Still Having Issues?

1. **Backup to text input** - Use the regular typing in input box
2. **Check system audio** - Test in Voice Recorder or Teams first
3. **Try different browser** - Chrome/Edge are most reliable
4. **Restart computer** - Full restart often fixes hardware issues
5. **Check microphone in settings** - Windows Settings → Devices → Microphone

---

## 🚀 Voice Features

✅ **Supported Languages:**
- 🇮🇳 English (India)
- 🇮🇳 Hindi
- 🇮🇳 Tamil
- 🇮🇳 Bengali
- 🇮🇳 Marathi

✅ **What You Can Ask:**
- Crop recommendations
- Irrigation scheduling
- Disease diagnosis
- Farming guidance
- Weather-based advice
- Soil recommendations
- Profit estimates

✅ **AI Responds With:**
- Text response (always)
- Natural voice audio (when ElevenLabs works)
- Practical farming advice
- Farmer-friendly language

---

**Made with 💚 for Indian Farmers**
