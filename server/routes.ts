import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGroceryListSchema, insertGroceryItemSchema, insertInventoryItemSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
      res.status(201).json(item);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.patch("/api/items/:id/purchased", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { purchased } = req.body;
      const item = await storage.updateItemPurchased(itemId, purchased);
      res.json(item);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.deleteListItem(itemId);
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
      res.json(item);
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      await storage.deleteInventoryItem(itemId);
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
      const items = await storage.getListItems(list.id);
      res.json({ list, items });
    } catch (err) {
      handleError(err as Error, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
