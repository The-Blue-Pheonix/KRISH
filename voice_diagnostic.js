// Voice System Diagnostic Tool
// Open browser console (F12 → Console tab) and paste this code to run diagnostics

async function diagnoseVoiceSystem() {
  console.log('%c🔍 KRISHI AI Voice System Diagnostic', 'font-size: 16px; font-weight: bold; color: green;');
  console.log('=' .repeat(60));
  
  const results = {
    timestamp: new Date().toLocaleString(),
    browser: navigator.userAgent,
    checks: {}
  };

  // Check 1: Browser Support
  console.log('\n✓ Check 1: Browser Speech Recognition Support');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  results.checks.browserSupport = {
    supported: !!SpeechRecognition,
    type: SpeechRecognition ? 'Native Web Speech API' : 'Not Available'
  };
  console.log(results.checks.browserSupport);

  // Check 2: Microphone Permission
  console.log('\n✓ Check 2: Microphone Permission Status');
  try {
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
    results.checks.microphonePermission = {
      state: permissionStatus.state,
      status: permissionStatus.state === 'granted' ? '✅ ALLOWED' : '⚠️ ' + permissionStatus.state.toUpperCase()
    };
    console.log(results.checks.microphonePermission);
  } catch (e) {
    console.log('⚠️ Could not check permission status (may need user action)');
  }

  // Check 3: Audio Output
  console.log('\n✓ Check 3: Audio Output (Speakers)');
  const audio = new Audio();
  results.checks.audioSupport = {
    supported: !!audio.play,
    canPlayMP3: audio.canPlayType('audio/mpeg') !== '',
    canPlayWAV: audio.canPlayType('audio/wav') !== ''
  };
  console.log(results.checks.audioSupport);

  // Check 4: Network Connectivity
  console.log('\n✓ Check 4: Network Connectivity');
  try {
    const networkTest = await fetch('https://www.google.com/images/branding/googlelogo/', {
      mode: 'no-cors'
    });
    results.checks.network = {
      googleReachable: 'YES - External APIs accessible ✅',
      status: 'Good'
    };
  } catch (e) {
    results.checks.network = {
      googleReachable: 'NO - External connection blocked ⚠️',
      status: 'Network issue detected',
      error: e.message
    };
  }
  console.log(results.checks.network);

  // Check 5: Local Backend
  console.log('\n✓ Check 5: Local Backend Server');
  try {
    const backendTest = await fetch('http://localhost:8000/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await backendTest.json();
    results.checks.backend = {
      running: 'YES ✅',
      status: data.status
    };
  } catch (e) {
    results.checks.backend = {
      running: 'NO ⚠️',
      error: 'Make sure backend is running: uvicorn app.main:app --reload',
      details: e.message
    };
  }
  console.log(results.checks.backend);

  // Check 6: Environment
  console.log('\n✓ Check 6: Browser Environment');
  results.checks.environment = {
    online: navigator.onLine ? 'YES ✅' : 'NO ⚠️',
    userAgent: navigator.userAgent.substring(0, 50) + '...',
    language: navigator.language,
    hardwareConcurrency: navigator.hardwareConcurrency + ' cores'
  };
  console.log(results.checks.environment);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('%c📋 DIAGNOSTIC SUMMARY', 'font-size: 14px; font-weight: bold;');
  console.log(results);

  // Recommendations
  console.log('\n%c💡 RECOMMENDATIONS:', 'font-size: 12px; font-weight: bold; color: blue;');
  const issues = [];
  
  if (!results.checks.browserSupport.supported) {
    issues.push('❌ Browser does not support Web Speech API. Use Chrome, Edge, or Safari.');
  }
  
  if (results.checks.microphonePermission?.state === 'denied') {
    issues.push('⚠️ Microphone permission is DENIED. Reset it in: Settings → Privacy → Microphone');
  }
  
  if (results.checks.network?.status === 'Network issue detected') {
    issues.push('⚠️ Cannot reach Google servers. Check firewall/VPN and internet connection.');
  }
  
  if (results.checks.backend.running === 'NO ⚠️') {
    issues.push('❌ Backend server is not running. Start it with: cd backend && uvicorn app.main:app --reload');
  }
  
  if (!navigator.onLine) {
    issues.push('⚠️ No internet connection detected.');
  }

  if (issues.length === 0) {
    console.log('%c✅ All systems operational! Voice chat should work.', 'color: green; font-weight: bold;');
  } else {
    console.log('%cFound issues:', 'color: orange; font-weight: bold;');
    issues.forEach(issue => console.log(issue));
  }

  console.log('\n' + '='.repeat(60));
  return results;
}

// Run the diagnostic
diagnoseVoiceSystem().then(results => {
  console.log('%c📥 Diagnostic complete! Scroll up to see full report.', 'color: green; font-weight: bold;');
});
