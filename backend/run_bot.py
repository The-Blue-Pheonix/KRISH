#!/usr/bin/env python3
"""
Telegram Bot Launcher for Krishi Agriculture Bot
Run this script separately from the FastAPI backend
"""

import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from telegram_bot import start_bot

if __name__ == "__main__":
    print("=" * 50)
    print("🌾 KRISHI TELEGRAM BOT")
    print("=" * 50)
    print("\n✅ Bot Features:")
    print("  • 📊 Get farm data from your profile")
    print("  • 🤖 Chat with AI for farming advice")
    print("  • 🌱 Get crop recommendations")
    print("  • 🧪 Soil health analysis")
    print("  • 📍 Location-based services")
    print("\n🔗 Bot URL: https://t.me/krishi_help_bot")
    print("\n" + "=" * 50)
    
    try:
        start_bot()
    except KeyboardInterrupt:
        print("\n\n❌ Bot stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
