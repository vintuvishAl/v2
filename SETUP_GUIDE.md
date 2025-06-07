# LLM Chat App Setup Guide

## 🔑 API Keys Setup

### Required API Keys

You need to obtain API keys from these providers:

1. **OpenAI API Key**
   - Go to: https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Anthropic API Key**
   - Go to: https://console.anthropic.com/
   - Create a new API key
   - Copy the key (starts with `sk-ant-`)

3. **Google Gemini API Key**
   - Go to: https://aistudio.google.com/app/apikey
   - Create a new API key
   - Copy the key

### Setting API Keys in Convex

Run these commands in your terminal (replace with your actual keys):

```bash
# Set OpenAI API Key
npx convex env set OPENAI_API_KEY sk-your-actual-openai-key-here

# Set Anthropic API Key  
npx convex env set ANTHROPIC_API_KEY sk-ant-your-actual-anthropic-key-here

# Set Google Gemini API Key
npx convex env set GOOGLE_GENERATIVE_AI_API_KEY your-actual-gemini-key-here
```

### Verify Environment Variables

Check that your keys are set correctly:

```bash
npx convex env list
```

## 🤖 Available Models

The app now supports three AI models:

1. **OpenAI GPT-4** - Advanced reasoning and creativity
2. **Anthropic Claude** - Helpful, harmless, and honest
3. **Google Gemini** - Fast and multimodal AI

## 🎯 How to Change Models

### In the App:
1. Open the chat interface
2. Tap the model name in the top-right corner (e.g., "OpenAI GPT-4")
3. Select your preferred model from the modal
4. The selection is saved automatically

### Programmatically:
You can also change models by updating user preferences:

```typescript
await updatePreferences({ 
  userId: "your-user-id", 
  selectedLLM: "openai" // or "anthropic" or "gemini"
});
```

## 🚀 Running the App

### 1. Start Convex Backend
```bash
npx convex dev
```

### 2. Start Expo Frontend
```bash
npx expo start
```

### 3. Open in Device/Simulator
- Scan QR code with Expo Go app (mobile)
- Press 'i' for iOS simulator
- Press 'a' for Android emulator
- Press 'w' for web browser

## ✅ Testing the App

### 1. Basic Chat Test
- Type a message like "Hello, how are you?"
- You should see a streaming response from the selected AI model

### 2. Model Switching Test
- Change the model using the dropdown
- Send another message
- Verify the response comes from the new model

### 3. Tool Usage Test
- Try: "Search the web for latest AI news"
- Try: "Help me read a file"
- The AI should attempt to use the available tools

## 🔧 Troubleshooting

### Common Issues:

1. **"API key not found" errors**
   - Make sure you've set the environment variables correctly
   - Run `npx convex env list` to verify
   - Redeploy with `npx convex deploy`

2. **"Network request failed" errors**
   - Check your internet connection
   - Verify the Convex URL in `.env.local`
   - Make sure Convex dev server is running

3. **App crashes on startup**
   - Clear Expo cache: `npx expo start -c`
   - Check console logs for specific errors

4. **Streaming not working**
   - Verify HTTP endpoint is deployed
   - Check browser network tab for failed requests
   - Ensure CORS is properly configured

### Debug Commands:

```bash
# Check Convex functions
npx convex logs

# View environment variables
npx convex env list

# Restart with clean cache
npx expo start -c

# Check deployment status
npx convex dashboard
```

## 🌟 Features Working

- ✅ Real-time chat with AI models
- ✅ Model switching (OpenAI, Anthropic, Gemini)
- ✅ Streaming responses
- ✅ User preferences persistence
- ✅ Tool integration framework
- ✅ Mobile-friendly UI
- ✅ Dark theme

## 🛠 Next Steps

1. **Add Your API Keys** (most important!)
2. **Test the basic chat functionality**
3. **Try switching between models**
4. **Implement additional MCP tools as needed**
5. **Customize the UI/UX**
6. **Add more features (file upload, voice, etc.)**

## 📱 App Architecture

```
Frontend (Expo/React Native)
    ↓
Convex Backend (Real-time sync)
    ↓  
AI Agents (OpenAI/Anthropic/Gemini)
    ↓
Tools/MCP Servers (File system, Web search, etc.)
```

The app is fully functional once you add your API keys!
