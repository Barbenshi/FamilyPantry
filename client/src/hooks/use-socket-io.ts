import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

export function useSocketIO() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the server using the same origin.
    const socket = io(window.location.origin, {
      query: { token: "yourTokenHere" } // include any auth token if needed
    });
    console.log("Connecting to Socket.IO at", window.location.origin);

    // Listen for list updates
    socket.on("listUpdate", (data: { listId?: number }) => {
      if (data.listId) {
        queryClient.invalidateQueries({ queryKey: [`/api/lists/${data.listId}/items`] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      }
    });

    // Listen for inventory updates
    socket.on("inventoryUpdate", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return socketRef;
}
