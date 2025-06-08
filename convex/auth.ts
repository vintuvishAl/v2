import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async redirect({ redirectTo }) {
      // For Expo development, use the tunnel URL
      // Replace with your actual Expo development URL
      // You can find this in your Expo CLI output when you run 'expo start'
      return redirectTo || "exp://192.168.1.100:8081/--/auth/callback";
    },
  },
});

// Helper query to get the current authenticated user
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }
    
    // Get the user from the users table
    const user = await ctx.db.get(userId);
    return user;
  },
});
