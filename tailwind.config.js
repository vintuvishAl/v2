/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./<custom directory>/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Light theme colors
        'app-light': {
          text: '#1f2937',
          background: '#ffffff',
          tint: '#2563eb',
          icon: '#6b7280',
          'chat-bg': '#f8fafc',
          'user-message': '#2563eb',
          'ai-message': '#f1f5f9',
          border: '#e2e8f0',
        },
        // Dark theme colors
        'app-dark': {
          text: '#f8fafc',
          background: '#101827',
          tint: '#1769aa',
          icon: '#1769aa',
          'chat-bg': '#1e293b',
          'user-message': '#3b82f6',
          'ai-message': '#334155',
          border: '#475569',
          placeholder: '#9ca3af',
        },
        // Action button colors
        create: '#3b82f6',    // Blue
        explore: '#10b981',   // Green
        code: '#8b5cf6',      // Purple
        learn: '#f59e0b',     // Amber
      },
    },
  },
  plugins: [],
}

