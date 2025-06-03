import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { insertGroceryListSchema, insertGroceryItemSchema, insertInventoryItemSchema } from "@shared/schema";
import { ZodError } from "zod";

type WebSocketMessage = {
  type: 'listUpdate' | 'inventoryUpdate';
  listId?: number;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // const httpServer = createServer(app);
  // const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const httpServer = createServer(app);
  // Create a Socket.IO server attached to the HTTP server
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" } // adjust CORS options as needed
  });

  const broadcastUpdate = (message: { type: 'listUpdate' | 'inventoryUpdate'; listId?: number }) => {
    io.emit(message.type, message);
  };

  // Error handling middleware
  const handleError = (err: Error, res: any) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: err.errors });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Grocery Lists
  app.get("/api/lists", async (_req, res) => {
    try {
      const lists = await storage.getAllLists();
      res.json(lists);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/lists", async (req, res) => {
    try {
      const data = insertGroceryListSchema.parse(req.body);
      const list = await storage.createList(data);
      broadcastUpdate({ type: 'listUpdate' });
      res.status(201).json(list);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.get("/api/lists/:id/items", async (req, res) => {
    try {
      const listId = parseInt(req.params.id);
      const items = await storage.getListItems(listId);
      res.json(items);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/lists/:id/items", async (req, res) => {
    try {
      const listId = parseInt(req.params.id);
      const data = insertGroceryItemSchema.parse({ ...req.body, listId });
      const item = await storage.addItemToList(data);
      broadcastUpdate({ type: 'listUpdate', listId });
      res.status(201).json(item);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.patch("/api/items/:id/purchased", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { purchased } = req.body;
      const result = await storage.updateItemPurchased(itemId, purchased);
      broadcastUpdate({ type: 'listUpdate', listId: result.groceryItem.listId });
      if (result.inventoryItem) {
        broadcastUpdate({ type: 'inventoryUpdate' });
      }
      res.json(result);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getListItems(itemId);
      await storage.deleteListItem(itemId);
      if (item.length > 0) {
        broadcastUpdate({ type: 'listUpdate', listId: item[0].listId });
      }
      res.status(204).end();
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Inventory
  app.get("/api/inventory", async (_req, res) => {
    try {
      const items = await storage.getAllInventoryItems();
      res.json(items);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const data = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(data);
      broadcastUpdate({ type: 'inventoryUpdate' });
      res.status(201).json(item);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.patch("/api/inventory/:id/quantity", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { quantity } = req.body;
      const item = await storage.updateInventoryQuantity(itemId, quantity);
      broadcastUpdate({ type: 'inventoryUpdate' });
      res.json(item);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.deleteInventoryItem(itemId);
      broadcastUpdate({ type: 'inventoryUpdate' });
      res.status(204).end();
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  // Shared Lists
  app.get("/api/share/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      const list = await storage.getListByShareId(shareId);
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }
      const items = await storage.getListItems(list._id);
      res.json({ list, items });
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  return httpServer;
}