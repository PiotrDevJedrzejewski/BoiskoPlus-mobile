/**
 * Route that has to wait until the user is logged in and the dashboard is shown.
 * Saved by app/+native-intent.js (event links) and NotificationContext
 * (push notification that cold-started the app).
 *
 * Zustand instead of AuthContext: +native-intent.js runs outside the React
 * tree, so it needs getState().
 * (auth)/dashboard-home.jsx opens the route in useFocusEffect.
 *
 * Kept only in memory: when the app is killed, the pending link is gone,
 * and the user can simply tap the link again.
 */

import { create } from "zustand";

export const useDeepLinkStore = create((set, get) => ({
  pendingRoute: null,

  setPendingRoute: (route) => set({ pendingRoute: route }),

  // Returns the route and clears it, so it is used only once
  consumePendingRoute: () => {
    const route = get().pendingRoute;
    set({ pendingRoute: null });
    return route;
  },
}));
