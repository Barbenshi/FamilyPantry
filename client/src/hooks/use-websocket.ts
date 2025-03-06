import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'listUpdate') {
        // Invalidate specific list if listId is provided, otherwise invalidate all lists
        if (data.listId) {
          queryClient.invalidateQueries({ queryKey: [`/api/lists/${data.listId}/items`] });
        } else {
          queryClient.invalidateQueries({ queryKey: ['/api/lists'] });
        }
      }
      
      if (data.type === 'inventoryUpdate') {
        queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [queryClient]);
}
