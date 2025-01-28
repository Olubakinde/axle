/* eslint-disable @typescript-eslint/no-explicit-any */
// Define Liveblocks types for your application

import { LiveMap } from "@liveblocks/client";

// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // Example, a conflict-free list
      // animals: LiveList<string>;

      canvasObjects: LiveMap<string, any>
    };
  }
}

export {};
