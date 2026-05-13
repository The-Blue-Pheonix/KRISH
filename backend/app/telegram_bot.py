import os
import asyncio
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    Application, CommandHandler, MessageHandler, filters, 
    ContextTypes, ConversationHandler
)
from dotenv import load_dotenv
from services.core_engine import (
    process_user_query, get_quick_recommendations, 
    get_farm_summary, save_user_location, get_user_location
)
import logging

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8772496043:AAE1BEZAysEWbzIxv0_IVD1yDBGWXzpqJ_o")

# Conversation states
ASKING_CROP = 1
ASKING_SOIL = 2
ASKING_LOCATION = 3

# ==================== Command Handlers ====================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command - Show welcome message and available commands"""
    welcome_text = """
🌾 *Welcome to Krishi Help Bot!* 🌾

Your AI-powered agricultural assistant. I can help you with:

📊 **Get Farm Data** - View your crop, soil, and weather info
🤖 **Ask AI** - Talk with AI for farming advice
🌱 **Crop Details** - Information about specific crops
🧪 **Soil Analysis** - Get soil health recommendations
📍 **Weather & Location** - Check local conditions

Use the menu below or type /help for all commands.
    """
    
    keyboard = [
        ["📊 Farm Data", "🤖 AI Chat"],
        ["🌱 Crops", "🧪 Soil Info"],
        ["📍 Location", "❓ Help"]
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
/farmdata - Get your farm information
/cropinfo - Get crop recommendations
/soilinfo - Get soil analysis
/weather - Get weather forecast
/aichat - Chat with AI assistant
/settings - Configure your preferences

*Quick Buttons:*
- 📊 Farm Data
- 🤖 AI Chat
- 🌱 Crops
- 🧪 Soil Info
- 📍 Location
    """
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def farm_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Retrieve and display farm data from backend"""
    try:
        user_id = update.effective_user.id
        
        # Sample farm data for demonstration
        farm_info = f"""
*🌾 Your Farm Information*

👨‍🌾 *Farmer:* Demo Farmer
📍 *Location:* Maharashtra, India
🏞️ *Farm Size:* 5 hectares

*🌱 Crops Growing:*
• Rice - Healthy (80%)
• Wheat - Good (75%)
• Sugarcane - Excellent (85%)

*🧪 Soil Information:*
• pH: 6.8 (Neutral)
• Moisture: 65% (Good)
• Nitrogen: 250 ppm
• Phosphorus: 45 ppm
• Potassium: 150 ppm

*📊 Farm Health Score: 80/100*
"""
        
        await update.message.reply_text(farm_info, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"Error fetching farm data: {e}")
        await update.message.reply_text(f"❌ Error: Could not fetch farm data. {str(e)}")

async def ai_chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start AI conversation mode with full pipeline"""
    if update.message:
        user_message = update.message.text.replace('/aichat', '').strip()
        
        if not user_message:
            await update.message.reply_text(
                "🤖 AI Chat Mode Active!\n\nAsk me anything about farming:\n• Crop diseases\n• Weather patterns\n• Soil health\n• Profit optimization\n• Pest management\n\nType your question:"
            )
            return
    else:
        user_message = context.args[0] if context.args else ""
    
    if not user_message:
        return
    
    try:
        user_id = update.effective_user.id
        
        # Show typing indicator
        await update.message.chat.send_action("typing")
        
        # Get user's saved location if available
        user_location = get_user_location(user_id)
        
        # Process through core engine pipeline
        ai_response = await process_user_query(user_id, user_message, user_location)
        
        # Split long messages (Telegram limit is 4096 chars)
        if len(ai_response) > 4000:
            for i in range(0, len(ai_response), 4000):
                await update.message.reply_text(ai_response[i:i+4000])
        else:
            await update.message.reply_text(f"🤖 *AI Response:*\n\n{ai_response}", parse_mode='Markdown')
    
    except Exception as e:
        logger.error(f"Error in AI chat: {e}")
        await update.message.reply_text(f"❌ AI Error: {str(e)}")

async def crop_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get crop recommendations using core engine"""
    try:
        user_id = update.effective_user.id
        user_message = "What are the best crops to grow in this season? Give me a list with expected yields and profit margins."
        
        await update.message.chat.send_action("typing")
        
        # Get user's location
        user_location = get_user_location(user_id)
        
        # Process through core engine
        ai_response = await process_user_query(user_id, user_message, user_location)
        
        crop_text = f"*🌱 Recommended Crops:*\n\n{ai_response}"
        await update.message.reply_text(crop_text, parse_mode='Markdown')
    
    except Exception as e:
        logger.error(f"Error getting crop info: {e}")
        await update.message.reply_text(f"❌ Error: {str(e)}")

async def soil_info(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Get soil health recommendations using core engine"""
    try:
        user_id = update.effective_user.id
        user_message = "Give me detailed soil health improvement tips including: nutrient management, fertilizer recommendations, pH balance, crop rotation, and organic matter. Focus on practical Indian farmer solutions."
        
        await update.message.chat.send_action("typing")
        
        # Get user's location
        user_location = get_user_location(user_id)
        
        # Process through core engine
        ai_response = await process_user_query(user_id, user_message, user_location)
        
        soil_text = f"*🧪 Soil Health Tips:*\n\n{ai_response}"
        await update.message.reply_text(soil_text, parse_mode='Markdown')
    
    except Exception as e:
        logger.error(f"Error getting soil info: {e}")
        await update.message.reply_text(f"❌ Error: {str(e)}")

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages and route to appropriate handler"""
    text = update.message.text
    user_id = update.effective_user.id
    
    if text == "📊 Farm Data":
        await farm_data(update, context)
    elif text == "🤖 AI Chat":
        await update.message.reply_text("Ask me anything about farming!")
        context.user_data['in_chat_mode'] = True
    elif text == "🌱 Crops":
        await crop_info(update, context)
    elif text == "🧪 Soil Info":
        await soil_info(update, context)
    elif text == "📍 Location":
        await update.message.reply_text("📍 Please type your location (e.g., 'Mumbai, Maharashtra' or 'Delhi'):")
        context.user_data['waiting_for_location'] = True
    elif text == "❓ Help":
        await help_command(update, context)
    elif context.user_data.get('waiting_for_location'):
        # User is providing their location
        save_user_location(user_id, text)
        context.user_data['waiting_for_location'] = False
        await update.message.reply_text(f"✅ Location saved: {text}\n\nNow I can give you location-specific recommendations!")
    else:
        # If in chat mode, send to AI
        if context.user_data.get('in_chat_mode'):
            context.args = [text]
            await ai_chat(update, context)
        else:
            # Default: send to AI with full context
            context.args = [text]
            await ai_chat(update, context)

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Log errors"""
    logger.error(f"Update {update} caused error {context.error}")
    if update and update.message:
        await update.message.reply_text("❌ An error occurred. Please try again.")

# ==================== Bot Startup ====================

def start_bot():
    """Start the Telegram bot"""
    print("🤖 Starting Krishi Telegram Bot...")
    
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Add command handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("farmdata", farm_data))
    app.add_handler(CommandHandler("aichat", ai_chat))
    app.add_handler(CommandHandler("cropinfo", crop_info))
    app.add_handler(CommandHandler("soilinfo", soil_info))
    
    # Add text message handler
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    
    # Add error handler
    app.add_error_handler(error_handler)
    
    print("✅ Bot is running. Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    start_bot()