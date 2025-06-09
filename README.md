# 🤖 LLM Chat App - Convex + Expo
*A powerful, multi-modal AI chat application built with Convex and React Native*

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-blue)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Convex](https://img.shields.io/badge/Convex-FF6B6B?style=flat&logo=convex&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

## 🌟 Why Expo/React Native Instead of a Web App?

This LLM chat application is built as a **cross-platform mobile app** rather than a traditional web application for several compelling reasons:

### 📱 **Native Mobile Features**
- **📸 Camera Integration**: Direct access to device camera for image analysis and multimodal AI interactions
- **🎙️ Voice Recording**: Native audio recording capabilities for voice-to-text and audio analysis
- **📳 Haptic Feedback**: Rich tactile feedback for enhanced user interaction (implemented with `expo-haptics`)
- **📍 Location Services**: GPS integration for location-aware AI assistance
- **📞 Contact Access**: Integration with device contacts for personalized AI responses
- **💾 File System Access**: Direct file upload and management capabilities
- **🔔 Push Notifications**: Real-time notifications for AI responses and chat updates

### 🚀 **Performance & User Experience**
- **⚡ Native Performance**: Smooth animations and transitions using `react-native-reanimated`
- **📱 Mobile-First Design**: Optimized touch interfaces and gesture recognition
- **🌙 Native UI Elements**: Platform-specific components (iOS blur effects, Android material design)
- **🔄 Offline Capabilities**: Local data storage and sync when connection returns
- **📊 Better Resource Management**: Efficient memory and battery usage compared to web browsers

### 🎯 **AI-Specific Advantages**
- **🖼️ Multimodal Input**: Easy integration of camera, microphone, and file uploads for AI analysis
- **📋 Clipboard Integration**: Seamless text and image sharing between apps
- **🔗 Deep Linking**: Direct app-to-app communication for AI workflows
- **⚡ Real-time Streaming**: Optimized for continuous AI response streaming
- **🎨 Rich Media Display**: Better handling of AI-generated images, documents, and media

### 🌐 **Cross-Platform Benefits**
- **📱 iOS + Android + Web**: Single codebase, three platforms
- **🔄 Consistent Experience**: Same features across all devices
- **🛠️ Easy Distribution**: App stores + web deployment
- **📈 Better Analytics**: Native app usage tracking and user insights

## 🎯 Perfect Use Cases for This App

- **📸 Visual AI Assistant**: Take photos and get AI analysis instantly
- **🎙️ Voice-Powered Chat**: Speak your questions, get audio responses
- **📄 Document Analysis**: Upload files directly from your device for AI processing
- **📍 Location-Aware AI**: Get contextual help based on where you are
- **🤝 Personal AI Companion**: Access your contacts, calendar, and files for personalized assistance
- **🎮 Interactive AI Games**: Leverage device sensors for immersive AI experiences
- **📊 Business AI Tools**: Professional workflows with camera scanning, voice notes, and file management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- [Expo CLI](https://docs.expo.dev/get-started/installation/) installed globally
- [Convex account](https://convex.dev) (free tier available)
- AI API keys (OpenAI, Anthropic, or Google)

### 1. Clone and Install
```bash
git clone <repository-url>
cd llm-app
npm install
```

### 2. Set Up Convex Backend
```bash
# Install Convex CLI globally (if not already installed)
npm install -g convex

# Initialize your Convex project
npx convex dev
```

This will:
- Create a new Convex project
- Generate your deployment URL
- Set up the database schema
- Deploy all backend functions

### 3. Configure Environment Variables

Create `.env.local` in the root directory:

```bash
# Convex Configuration
EXPO_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud

# AI Provider API Keys (add at least one)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here  
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key_here

# Optional: For enhanced features
SEARCH_API_KEY=your_search_api_key
FILE_SYSTEM_ACCESS=enabled
```

### 4. Start the Development Server
```bash
# Start Convex backend (keep this running)
npx convex dev

# In a new terminal, start Expo
npx expo start
```

### 5. Launch the App
- **📱 Mobile**: Scan the QR code with Expo Go app
- **🖥️ Web**: Press `w` to open in browser
- **📱 iOS Simulator**: Press `i` (requires Xcode)
- **🤖 Android Emulator**: Press `a` (requires Android Studio)

## 🎯 Features

### ✅ **Current Features**
- 💬 **Multi-Model Chat**: Switch between OpenAI GPT-4, Anthropic Claude, and Google Gemini
- ⚡ **Real-Time Streaming**: Live response streaming with typing indicators  
- 🤖 **AI Agents**: Integrated Convex agents with tool calling capabilities
- 💾 **Chat History**: Persistent conversation storage and management
- 🎨 **Beautiful UI**: Dark theme with smooth animations and haptic feedback
- 📱 **Cross-Platform**: Runs on iOS, Android, and web with platform-specific optimizations
- 🔄 **Offline Support**: Local data caching and sync when online
- ⚙️ **User Preferences**: Customizable model selection and settings

### 🚧 **Coming Soon** (Ready to implement!)
- 📸 **Camera Integration**: Photo capture and AI image analysis
- 🎙️ **Voice Chat**: Speech-to-text and text-to-speech capabilities
- 📁 **File Upload**: Document analysis and file processing
- 📍 **Location Features**: GPS-based contextual assistance
- 🔔 **Push Notifications**: Real-time chat notifications
- 📊 **Advanced Analytics**: Usage insights and AI performance metrics

## 🏗️ Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│    Expo App         │────▶│    Convex Cloud     │────▶│    AI Providers     │
│  (React Native)     │     │    (Backend)        │     │  (OpenAI/Claude)    │
├─────────────────────┤     ├─────────────────────┤     ├─────────────────────┤
│ • Chat Interface    │     │ • Real-time DB      │     │ • GPT-4 / GPT-4o    │
│ • Camera/Media      │     │ • AI Agents         │     │ • Claude 3.5        │
│ • Voice Recording   │     │ • Streaming API     │     │ • Gemini 2.0        │
│ • File Management   │     │ • User Management   │     │ • Custom Models     │
│ • Push Notifications│     │ • Tool Integration  │     │ • Tool Calling      │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### **Key Components**

#### **Frontend (Expo/React Native)**
- `ChatView.tsx` - Main chat interface with real-time messaging
- `WelcomeScreen.tsx` - Onboarding and quick actions
- `MessageList.tsx` - Optimized message rendering with FlashList
- `ChatInput.tsx` - Input handling with voice/camera integration
- `ModelSelectorModal.tsx` - AI model switching interface

#### **Backend (Convex)**
- `chat.ts` - Chat management and message handling
- `agents.ts` - AI agent configuration and tool integration  
- `http.ts` - Streaming API endpoint for real-time responses
- `schema.ts` - Database schema for chats, users, and preferences

#### **AI Integration**
- Multiple provider support (OpenAI, Anthropic, Google)
- Streaming response handling
- Tool calling and function execution
- Context management and memory

## 🛠️ Development

### **Project Structure**
```
llm-app/
├── app/                 # Expo Router pages
├── components/          # React Native components
│   ├── chat/           # Chat-specific components
│   └── ui/             # Reusable UI components
├── convex/             # Backend functions and schema
├── hooks/              # Custom React hooks
├── constants/          # App constants and themes
└── assets/             # Images, fonts, and static files
```

### **Testing**
```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### **Building for Production**
```bash
# Build for all platforms
npx expo build

# Build for specific platform
npx expo build:ios
npx expo build:android
npx expo build:web
```

## 🌟 Why This Matters for the Convex Community

This project showcases **Convex's power in mobile development**:

1. **🔄 Real-Time Everything**: Convex's real-time subscriptions work perfectly with mobile apps
2. **⚡ Serverless Functions**: No server management, just deploy functions and go
3. **🗃️ Integrated Database**: Real-time database updates across all connected devices  
4. **🤖 AI Agents**: Built-in support for AI agents and tool calling
5. **📱 Mobile-First**: Proves Convex works great beyond web applications
6. **🚀 Developer Experience**: Hot reloading, type safety, and instant deployments

## 🤝 Contributing

We welcome contributions! This project is a great way to:
- Learn Convex with React Native
- Explore AI integration patterns
- Build mobile-first experiences
- Contribute to the Convex ecosystem

### **How to Contribute**
1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Submit a pull request

### **Areas for Contribution**
- 📸 Camera and image processing features
- 🎙️ Voice and audio capabilities  
- 🔧 Additional AI tools and integrations
- 🎨 UI/UX improvements
- 📚 Documentation and tutorials
- 🧪 Testing and quality assurance

## 📄 License

MIT License - feel free to use this project as a starting point for your own AI applications!

## 🔗 Resources

- [Convex Documentation](https://docs.convex.dev)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [AI SDK Documentation](https://sdk.vercel.ai)

---

**Built with ❤️ for the Convex community**

*Questions? Issues? Join the [Convex Discord](https://convex.dev/community) and let's chat!*
