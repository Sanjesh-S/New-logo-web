# Telegram Bot Setup Guide

## Prerequisites
1. A Telegram account
2. Access to Telegram BotFather (@BotFather)

## Steps to Set Up Telegram Bot

### 1. Create a Telegram Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the instructions to name your bot
4. BotFather will give you a **Bot Token** (e.g., `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Your Chat ID
1. Search for `@userinfobot` on Telegram
2. Start a conversation with it
3. It will reply with your Chat ID (e.g., `123456789`)

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add the following:

```env
TELEGRAM_BOT_TOKEN=8588484467:AAGgyZn5TNgz1LgmM0M5hQ_ZeQPk6JEzs6A
TELEGRAM_CHAT_ID=6493761091
```

**Important:** After creating/updating `.env.local`, restart your development server for the changes to take effect.

### 4. Test the Bot
1. Start a conversation with your bot on Telegram
2. Send a test message to ensure the bot is working
3. The bot will send notifications when pickup requests are confirmed

## Notification Format
When a customer confirms a pickup, you'll receive a Telegram message with:
- Device name and price
- Customer details (name, phone, email)
- Complete address
- Pickup date and time slot
- Request ID for tracking

## Troubleshooting
- **Bot not sending messages**: Check that `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are correctly set in `.env.local`
- **Invalid token**: Make sure you copied the full token from BotFather
- **Chat ID not found**: Ensure you've started a conversation with your bot first
