# Chat Components Architecture

This document describes the refactored chat component architecture.

## Overview

The original `ChatView` component has been broken down into smaller, more manageable components and a custom hook to handle all the business logic.

## Components

### 1. `useChat` Hook (`hooks/useChat.ts`)
Contains all the chat logic including:
- State management (messages, input text, selected model, etc.)
- Convex queries and mutations
- Message handling (send, suggested questions)
- Streaming response handling
- Chat creation and management

**Exports:**
- State: `messages`, `inputText`, `currentChatId`, `isCreatingChat`, `selectedModel`, `showModelModal`, `userName`
- Actions: `setInputText`, `setSelectedModel`, `setShowModelModal`, `handleSendMessage`, `handleSuggestedQuestion`, `startNewChat`

### 2. `ChatHeader` (`components/chat/ChatHeader.tsx`)
Top navigation bar with menu, search, and new chat buttons.

**Props:**
- `onMenuPress`: () => void
- `onSearchPress`: () => void  
- `onNewChatPress`: () => void

### 3. `WelcomeScreen` (`components/chat/WelcomeScreen.tsx`)
Initial screen shown when there are no messages, containing:
- Welcome message with user's name
- Action buttons (Create, Explore, Code, Learn)
- Suggested questions

**Props:**
- `userName`: string
- `onActionPress`: (action: string) => void
- `onSuggestedQuestionPress`: (question: string) => void

### 4. `MessageList` (`components/chat/MessageList.tsx`)
Displays the list of chat messages (both user and AI responses).

**Props:**
- `messages`: Message[]

### 5. `ChatInput` (`components/chat/ChatInput.tsx`)
Bottom input area containing:
- Text input field
- Model selector button
- Send button
- Additional action buttons (globe, attach)

**Props:**
- `inputText`: string
- `onInputChange`: (text: string) => void
- `onSendMessage`: () => void
- `onModelSelectorPress`: () => void
- `onGlobePress`: () => void
- `onAttachPress`: () => void
- `selectedModel`: ModelType
- `isCreatingChat`: boolean

### 6. `ModelSelectorModal` (`components/chat/ModelSelectorModal.tsx`)
Modal for selecting AI models (Gemini, GPT variants).

**Props:**
- `visible`: boolean
- `selectedModel`: ModelType
- `onClose`: () => void
- `onModelSelect`: (model: ModelType) => void

## Main ChatView Component

The main `ChatView` component now acts as a composition layer that:
1. Uses the `useChat` hook for all logic
2. Renders the appropriate components based on state
3. Handles simple UI interactions (menu, search, etc.)

## Benefits of This Architecture

1. **Separation of Concerns**: Logic is separated from UI components
2. **Reusability**: Individual components can be used in other contexts
3. **Testability**: Each component and the hook can be tested independently
4. **Maintainability**: Smaller components are easier to understand and modify
5. **Type Safety**: Strong TypeScript typing throughout the codebase

## Types

All shared types are defined in `hooks/useChat.ts`:
- `Message`: Chat message interface
- `ModelType`: Available AI model types

## File Structure

```
components/
├── chat/
│   ├── index.ts              # Exports all chat components
│   ├── ChatHeader.tsx        # Top navigation
│   ├── WelcomeScreen.tsx     # Initial welcome screen
│   ├── MessageList.tsx       # Message display
│   ├── ChatInput.tsx         # Input area
│   └── ModelSelectorModal.tsx # Model selection modal
├── ChatView.tsx              # Main chat component
hooks/
└── useChat.ts                # Chat logic hook
```
