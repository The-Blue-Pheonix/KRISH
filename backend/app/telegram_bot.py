import os
import asyncio
import json
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    Application, CommandHandler, MessageHandler, filters, 
    ContextTypes, ConversationHandler
)
from dotenv import load_dotenv
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Load environment variables from parent directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Import backend services
from app.services.llm import cached_llm_call, LANGUAGE_CONFIG, generate_agricultural_insight
from app.services.weather import get_weather
from app.services.predict import predict_crop
from app.services.irrigation import irrigation_decision
from app.services.soil_mapping import get_soil_by_location
from app.services.crop_health import get_crop_health
from app.services.profit import estimate_profit

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8772496043:AAE1BEZAysEWbzIxv0_IVD1yDBGWXzpqJ_o")

# In-memory user database (in production, use database)
user_profiles = {}


# Conversation states
ASKING_CROP = 1
ASKING_SOIL = 2
ASKING_LOCATION = 3

# ===========================================
# USER PROFILE MANAGEMENT
# ===========================================

def get_user_profile(user_id: int) -> dict:
    """Get or create user profile"""
    if user_id not in user_profiles:
        user_profiles[user_id] = {
            'location': 'Unknown',
            'soil': 'Loamy',  # Default soil type
            'language': 'en',
            'crops': [],
            'weather': {}
        }
    return user_profiles[user_id]

def save_user_location(user_id: int, location: str):
    """Save user's location and fetch soil/weather data"""
    profile = get_user_profile(user_id)
    profile['location'] = location
    
    # Auto-fetch soil type for location
    try:
        soil_data = get_soil_by_location(location)
        profile['soil'] = soil_data.get('soil_type', 'Loamy')
        logger.info(f"[User {user_id}] Soil data for {location}: {profile['soil']}")
    except Exception as e:
        logger.error(f"[User {user_id}] Error fetching soil: {e}")
        profile['soil'] = 'Loamy'

# ==================== Command Handlers ====================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command - Show welcome message and available commands"""
    user_id = update.effective_user.id
    get_user_profile(user_id)  # Initialize profile
    
    welcome_text = """
🌾 *Welcome to Krishi AI Bot!* 🌾

Your AI-powered agricultural assistant for farming advice.

💡 *Tip:* Set your location (/location) and soil type (/soil) for better recommendations!

But you can start asking questions right away →
    """
    
    keyboard = [
        ["📊 Farm Data", "🤖 AI Chat"],
        ["🌱 Crops", "🧪 Soil Info"],
        ["📍 Location", "⚙️ Settings"],
        ["❓ Help"]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    
    await update.message.reply_text(
        welcome_text,
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show all available commands"""
    help_text = """
*Available Commands:*

/start - Start the bot
/help - Show this help message
/location - Set your location
/soil - Set your soil type
/language - Choose language
/farmdata - View farm dashboard
/crops - Get crop recommendations
/soil_tips - Get soil health tips
/aichat - Chat with AI assistant
/clear - Clear cache/reset

*Quick Buttons:*
📊 Farm Data - View weather, crops & soil status
🤖 AI Chat - Ask farming questions
🌱 Crops - Best crops for your location
🧪 Soil Info - Soil health tips
📍 Location - Set/change location
⚙️ Settings - View & change preferences

*How it works:*
1. (Optional) Set your 📍 Location for weather-specific advice
2. (Optional) Choose 🧪 Soil Type  
3. Ask any farming question in 🤖 Chat
4. Get AI recommendations instantly!
    """
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def location_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Command handler for /location"""
    await set_location(update, context)

async def soil_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Command handler for /soil"""
    await set_soil(update, context)

async def language_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Command handler for /language"""
    await set_language(update, context)

async def lang_en(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Set language to English"""
    user_id = update.effective_user.id
    profile = get_user_profile(user_id)
    profile['language'] = 'en'
    await update.message.reply_text("✅ Language set to English")

async def lang_bn(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Set language to Bengali"""
    user_id = update.effective_user.id
    profile = get_user_profile(user_id)
    profile['language'] = 'bn'
    await update.message.reply_text("✅ ভাষা বাংলায় সেট করা হয়েছে")

async def lang_hi(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Set language to Hindi"""
    user_id = update.effective_user.id
    profile = get_user_profile(user_id)
    profile['language'] = 'hi'
    await update.message.reply_text("✅ भाषा हिंदी में सेट की गई")

async def lang_mr(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Set language to Marathi"""
    user_id = update.effective_user.id
    profile = get_user_profile(user_id)
    profile['language'] = 'mr'
    await update.message.reply_text("✅ भाषा मराठीमध्ये सेट केली गई")

async def lang_ta(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Set language to Tamil"""
    user_id = update.effective_user.id
    profile = get_user_profile(user_id)
    profile['language'] = 'ta'
    await update.message.reply_text("✅ மொழி தமிழில் அமைக்கப்பட்டுள்ளது")


async def farm_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Retrieve and display farm data from backend services"""
    try:
        user_id = update.effective_user.id
        profile = get_user_profile(user_id)
        
        # Show typing indicator
        await update.message.chat.send_action("typing")
        
        location = profile.get('location', 'Unknown')
        soil = profile.get('soil', 'Loamy')
        
        # Fetch weather data
        weather_data = get_weather(city=location) if location != 'Unknown' else {}
        temp = weather_data.get('temperature', '--')
        humidity = weather_data.get('humidity', '--')
        rainfall = weather_data.get('rainfall', '--')
        profile['weather'] = weather_data
        
        # Predict best crop
        # Safe predict crop
        _w = profile.get('weather', {})
        _t = _w.get('temperature', 25)
        _h = _w.get('humidity', 60)
        _r = _w.get('rainfall', 100)
        try:
            _t = float(_t)
            _h = float(_h)
            _r = float(_r)
            _crop = predict_crop(temp=_t, humidity=_h, rainfall=_r, soil=soil)
        except Exception:
            _crop = 'Wheat'
        ml_output = {'predicted_crop': _crop}
        predicted_crop = ml_output.get('predicted_crop', 'Unknown')
        
        # Check crop health
        crop_health = get_crop_health(predicted_crop, season='Summer')
        health_score = crop_health.get('health_score', '--')
        
        # Get irrigation decision
        irrigation_needed = irrigation_decision(
            soil_type=soil,
            humidity=humidity if humidity != '--' else 50,
            rainfall=rainfall if rainfall != '--' else 0
        )
        
        # Format response
        farm_info = f"""
*🌾 Your Farm Dashboard*

👨‍🌾 *Location:* {location}
🧪 *Soil Type:* {soil}

*🌤️ Current Weather:*
• Temperature: {temp}°C
• Humidity: {humidity}%
• Rainfall: {rainfall}mm

*🌱 Recommended Crop:*
• Primary: {predicted_crop}
• Health Score: {health_score}/100

*💧 Irrigation Status:*
• Status: {irrigation_needed}

*📊 Farm Health:*
Your farm is configured and monitored. Use the menu to get detailed recommendations.
"""
        
        await update.message.reply_text(farm_info, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"[Farm Data] Error: {e}")
        await update.message.reply_text(f"❌ Error fetching farm data: {str(e)[:100]}\n\nTry setting your location first with /location command.")


async def ai_chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """AI Chat - Connect to backend LLM with location, weather, and soil context"""
    try:
        user_id = update.effective_user.id
        
        # Get user message
        if update.message:
            user_message = update.message.text.replace('/aichat', '').strip()
        else:
            user_message = ' '.join(context.args) if context.args else ""
        
        if not user_message:
            profile = get_user_profile(user_id)
            location_status = f"📍 {profile['location']}" if profile['location'] != 'Unknown' else "⚠️ Location not set"
            
            await update.message.reply_text(
                f"🤖 *AI Chat Mode Active!*\n\n{location_status}\n🧪 Soil: {profile['soil']}\n\nAsk me anything about farming:\n"
                f"• Crop diseases\n• Soil health\n• Irrigation tips\n• Profit optimization\n• Weather-based recommendations\n\n"
                f"Type your question:",
                parse_mode='Markdown'
            )
            return
        
        # Show typing indicator
        await update.message.chat.send_action("typing")
        
        # Get user profile
        profile = get_user_profile(user_id)
        location = profile.get('location', 'Unknown')
        soil = profile.get('soil', 'Loamy')
        language = profile.get('language', 'en')
        weather = profile.get('weather', {})
        
        # Fetch fresh weather data if location is known
        if location != 'Unknown':
            try:
                weather = get_weather(city=location)
                profile['weather'] = weather
            except Exception as e:
                logger.error(f"[AI Chat] Weather fetch error: {e}")
                weather = profile.get('weather', {})
        
        # Prepare data for LLM (same format as voice-chat endpoint)
        user_input = {
            'query': user_message,
            'soil': soil,
            'location': location,
            'language': language,
            'weather': {
                'temperature': weather.get('temperature', 25),
                'humidity': weather.get('humidity', 60),
                'rainfall': weather.get('rainfall', 0),
                'condition': weather.get('condition', 'Unknown')
            }
        }
        
        # Get ML predictions
        # Safe predict crop
        _w = profile.get('weather', {})
        _t = _w.get('temperature', 25)
        _h = _w.get('humidity', 60)
        _r = _w.get('rainfall', 100)
        try:
            _t = float(_t)
            _h = float(_h)
            _r = float(_r)
            _crop = predict_crop(temp=_t, humidity=_h, rainfall=_r, soil=soil)
        except Exception:
            _crop = 'Wheat'
        ml_output = {'predicted_crop': _crop}
        ml_output['irrigation'] = irrigation_decision(
            soil_type=soil,
            humidity=user_input['weather']['humidity'],
            rainfall=user_input['weather']['rainfall']
        )
        
        # Get crop health analysis
        crop = ml_output.get('predicted_crop', 'Wheat')
        try:
            crop_health = get_crop_health(crop, season='Summer')
            ml_output['crop_health'] = crop_health
        except Exception as e:
            logger.error(f"[AI Chat] Crop health error: {e}")
            ml_output['crop_health'] = {}
        
        # Call LLM with all context (same as /voice-chat endpoint)
        logger.info(f"[AI Chat] User {user_id} | Location: {location} | Soil: {soil} | Query: {user_message[:50]}")
        ai_response = generate_agricultural_insight(user_input, ml_output)
        
        # Split long messages (Telegram limit is 4096 chars)
        if len(ai_response) > 4000:
            for i in range(0, len(ai_response), 4000):
                await update.message.reply_text(ai_response[i:i+4000], parse_mode='Markdown')
        else:
            await update.message.reply_text(ai_response, parse_mode='Markdown')
            
        logger.info(f"[AI Chat] Response sent (length: {len(ai_response)})")
        
    except Exception as e:
        logger.error(f"[AI Chat] Error: {e}", exc_info=True)
        await update.message.reply_text(f"❌ AI Error: {str(e)[:100]}\n\nTry setting your location first: /location")


async def crop_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get crop recommendations using backend ML + LLM"""
    try:
        user_id = update.effective_user.id
        profile = get_user_profile(user_id)
        
        await update.message.chat.send_action("typing")
        
        location = profile.get('location', 'Unknown')
        soil = profile.get('soil', 'Loamy')
        language = profile.get('language', 'en')
        
        # Fetch weather
        weather = profile.get('weather', {})
        if location != 'Unknown':
            try:
                weather = get_weather(city=location)
                profile['weather'] = weather
            except:
                pass
        
        # Prepare input for LLM
        user_input = {
            'query': 'What are the best crops to grow in this season? Give me a list with expected yields and profit margins.',
            'soil': soil,
            'location': location,
            'language': language,
            'weather': {
                'temperature': weather.get('temperature', 25),
                'humidity': weather.get('humidity', 60),
                'rainfall': weather.get('rainfall', 0),
                'condition': weather.get('condition', 'Unknown')
            }
        }
        
        # Get ML predictions
        # Safe predict crop
        _w = profile.get('weather', {})
        _t = _w.get('temperature', 25)
        _h = _w.get('humidity', 60)
        _r = _w.get('rainfall', 100)
        try:
            _t = float(_t)
            _h = float(_h)
            _r = float(_r)
            _crop = predict_crop(temp=_t, humidity=_h, rainfall=_r, soil=soil)
        except Exception:
            _crop = 'Wheat'
        ml_output = {'predicted_crop': _crop}
        
        # Get AI response
        ai_response = generate_agricultural_insight(user_input, ml_output)
        
        crop_text = f"*🌱 Recommended Crops for Your Farm:*\n\n{ai_response}"
        
        if len(crop_text) > 4000:
            for i in range(0, len(crop_text), 4000):
                await update.message.reply_text(crop_text[i:i+4000], parse_mode='Markdown')
        else:
            await update.message.reply_text(crop_text, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"[Crop Info] Error: {e}")
        await update.message.reply_text(f"❌ Error getting crop recommendations: {str(e)[:100]}")


async def soil_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get soil health recommendations using backend ML + LLM"""
    try:
        user_id = update.effective_user.id
        profile = get_user_profile(user_id)
        
        await update.message.chat.send_action("typing")
        
        location = profile.get('location', 'Unknown')
        soil = profile.get('soil', 'Loamy')
        language = profile.get('language', 'en')
        
        # Fetch weather
        weather = profile.get('weather', {})
        if location != 'Unknown':
            try:
                weather = get_weather(city=location)
                profile['weather'] = weather
            except:
                pass
        
        # Prepare input for LLM
        user_input = {
            'query': 'Give me detailed soil health improvement tips including: nutrient management, fertilizer recommendations, pH balance, crop rotation, and organic matter. Focus on practical Indian farmer solutions.',
            'soil': soil,
            'location': location,
            'language': language,
            'weather': {
                'temperature': weather.get('temperature', 25),
                'humidity': weather.get('humidity', 60),
                'rainfall': weather.get('rainfall', 0),
                'condition': weather.get('condition', 'Unknown')
            }
        }
        
        # Get ML predictions for context
        # Safe predict crop
        _w = profile.get('weather', {})
        _t = _w.get('temperature', 25)
        _h = _w.get('humidity', 60)
        _r = _w.get('rainfall', 100)
        try:
            _t = float(_t)
            _h = float(_h)
            _r = float(_r)
            _crop = predict_crop(temp=_t, humidity=_h, rainfall=_r, soil=soil)
        except Exception:
            _crop = 'Wheat'
        ml_output = {'predicted_crop': _crop}
        
        # Get AI response
        ai_response = generate_agricultural_insight(user_input, ml_output)
        
        soil_text = f"*🧪 Soil Health Recommendations:*\n\n{ai_response}"
        
        if len(soil_text) > 4000:
            for i in range(0, len(soil_text), 4000):
                await update.message.reply_text(soil_text[i:i+4000], parse_mode='Markdown')
        else:
            await update.message.reply_text(soil_text, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"[Soil Info] Error: {e}")
        await update.message.reply_text(f"❌ Error getting soil recommendations: {str(e)[:100]}")


async def set_location(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Prompt user to set their location via Telegram button or text"""
    keyboard = [
        [{"text": "📍 Share My Location", "request_location": True}],
    ]
    from telegram import ReplyKeyboardMarkup
    reply_markup = ReplyKeyboardMarkup(keyboard, one_time_keyboard=True, resize_keyboard=True)

    await update.message.reply_text(
        "📍 *Set Your Location*\n\nPlease tap the button below to share your GPS location, or manually type your city name (e.g. 'Kolkata'):",
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )
    context.user_data['waiting_for_location'] = True

async def handle_location(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle GPS location from user"""
    user_id = update.effective_user.id
    if not context.user_data.get('waiting_for_location'):
        return
        
    lat = update.message.location.latitude
    lon = update.message.location.longitude
    
    # Try to reverse geocode using the weather API
    try:
        from app.services.weather import get_weather
        weather_data = get_weather(latitude=lat, longitude=lon)
        city_name = weather_data.get("location", f"{lat:.2f},{lon:.2f}")
        
        save_user_location(user_id, city_name) # Will auto-fetch soil if possible
        
        # update profile with explicit lat/lon and weather
        profile = get_user_profile(user_id)
        profile['weather'] = weather_data
        
    except Exception as e:
        logger.error(f"Error fetching location: {e}")
        city_name = f"Lat:{lat:.2f}, Lon:{lon:.2f}"
        save_user_location(user_id, city_name)

    context.user_data['waiting_for_location'] = False
    
    # Restore normal keyboard
    from telegram import ReplyKeyboardMarkup
    keyboard = [
        ["📊 Farm Data", "🤖 AI Chat"],
        ["🌱 Crops", "🧪 Soil Info"],
        ["📍 Location", "⚙️ Settings"],
    ]
    await update.message.reply_text(
        f"✅ Location saved via GPS: *{city_name}*\n\nNow I can give you location-specific recommendations!",
        reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True),
        parse_mode='Markdown'
    )

async def set_soil(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Prompt user to set their soil type"""
    soil_options = "🧪 *Select Your Soil Type:*\n\n• Loamy\n• Clay\n• Sandy\n• Silt\n\nJust type your soil type:"
    await update.message.reply_text(soil_options, parse_mode='Markdown')
    context.user_data['waiting_for_soil'] = True

async def set_language(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Let user choose language"""
    lang_options = """*Choose Your Language:*

🇬🇧 English - /lang_en
🇧🇩 বাংলা - /lang_bn
🇮🇳 हिन्दी - /lang_hi
🇮🇳 मराठी - /lang_mr
🇮🇳 தமிழ் - /lang_ta"""
    await update.message.reply_text(lang_options, parse_mode='Markdown')

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages and route to appropriate handler"""
    text = update.message.text
    user_id = update.effective_user.id
    profile = get_user_profile(user_id)
    
    # Handle location input
    if context.user_data.get('waiting_for_location'):
        save_user_location(user_id, text)
        context.user_data['waiting_for_location'] = False
        from telegram import ReplyKeyboardMarkup
        keyboard = [
            ["📊 Farm Data", "🤖 AI Chat"],
            ["🌱 Crops", "🧪 Soil Info"],
            ["📍 Location", "⚙️ Settings"],
        ]
        await update.message.reply_text(
            f"✅ Location saved: *{text}*\n\nNow I can give you location-specific recommendations!", 
            reply_markup=ReplyKeyboardMarkup(keyboard, resize_keyboard=True),
            parse_mode='Markdown'
        )
        return
    
    # Handle soil input
    if context.user_data.get('waiting_for_soil'):
        profile['soil'] = text
        context.user_data['waiting_for_soil'] = False
        await update.message.reply_text(f"✅ Soil type saved: *{text}*", parse_mode='Markdown')
        return
    
    # Route button presses
    if text == "📊 Farm Data":
        await farm_data(update, context)
    elif text == "🤖 AI Chat":
        await update.message.reply_text("Type your farming question:")
        context.user_data['in_chat_mode'] = True
    elif text == "🌱 Crops":
        await crop_info(update, context)
    elif text == "🧪 Soil Info":
        await soil_info(update, context)
    elif text == "📍 Location":
        await set_location(update, context)
    elif text == "⚙️ Settings":
        settings_menu = f"""*⚙️ Your Settings*

📍 Location: {profile.get('location', 'Not set')}
🧪 Soil Type: {profile.get('soil', 'Not set')}
🌐 Language: {profile.get('language', 'en')}

/location - Change location
/soil - Change soil type
/language - Change language"""
        await update.message.reply_text(settings_menu, parse_mode='Markdown')
    elif text == "❓ Help":
        await help_command(update, context)
    else:
        # Default: send to AI chat (allow even without location)
        # If user hasn't set location yet, remind them gently but proceed
        if profile['location'] == 'Unknown' and not context.user_data.get('location_reminder_shown'):
            await update.message.reply_text(
                "ℹ️ *Tip:* Set your location with /location for location-specific recommendations!\n\nFor now, answering your question with general guidance...",
                parse_mode='Markdown'
            )
            context.user_data['location_reminder_shown'] = True
        
        # Send to AI chat regardless of location
        context.user_data['in_chat_mode'] = False
        context.user_data['user_message'] = text
        update.message.text = f"/aichat {text}"
        await ai_chat(update, context)


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors"""
    logger.error(f"Update {update} caused error {context.error}")
    if update and update.message:
        await update.message.reply_text("❌ An error occurred. Please try again.")

# ==================== Bot Startup ====================

# ==================== Bot Startup ====================

def start_bot():
    """Start the Telegram bot"""
    print("🤖 Starting Krishi AI Telegram Bot...")
    print(f"📍 Using Groq LLM with cached responses")
    print(f"🌤️ Using Open-Meteo weather API")
    
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Add command handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("farmdata", farm_data))
    app.add_handler(CommandHandler("aichat", ai_chat))
    app.add_handler(CommandHandler("crops", crop_info))
    app.add_handler(CommandHandler("soil_tips", soil_info))
    app.add_handler(CommandHandler("location", location_command))
    app.add_handler(CommandHandler("soil", soil_command))
    app.add_handler(CommandHandler("language", language_command))
    
    # Language selection commands
    app.add_handler(CommandHandler("lang_en", lang_en))
    app.add_handler(CommandHandler("lang_bn", lang_bn))
    app.add_handler(CommandHandler("lang_hi", lang_hi))
    app.add_handler(CommandHandler("lang_mr", lang_mr))
    app.add_handler(CommandHandler("lang_ta", lang_ta))
    
    # Add text and location handlers
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    app.add_handler(MessageHandler(filters.LOCATION, handle_location))
    
    # Add error handler
    app.add_error_handler(error_handler)
    
    print("✅ Krishi AI Bot is running!")
    print("🔌 Connected to backend services:")
    print("   • Groq LLM (with caching)")
    print("   • Open-Meteo Weather API")
    print("   • Crop Prediction ML")
    print("   • Soil Analysis")
    print("\nPress Ctrl+C to stop.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    start_bot()
