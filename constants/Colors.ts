/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Theme colors for LLM Chat App with blue accents
 */

const tintColorLight = '#2563eb'; // Blue-600
const tintColorDark = '#3b82f6'; // Blue-500

export const Colors = {
  light: {
    text: '#1f2937', // Gray-800
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#6b7280', // Gray-500
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorLight,
    chatBackground: '#f8fafc', // Slate-50
    userMessage: '#2563eb', // Blue-600
    aiMessage: '#f1f5f9', // Slate-100
    border: '#e2e8f0', // Slate-200
  },
  dark: {
    text: '#f8fafc', // Slate-50
    background: '#0f172a', // Slate-900
    tint: tintColorDark,
    icon: '#94a3b8', // Slate-400
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    chatBackground: '#1e293b', // Slate-800
    userMessage: '#3b82f6', // Blue-500
    aiMessage: '#334155', // Slate-700
    border: '#475569', // Slate-600
  },
};
