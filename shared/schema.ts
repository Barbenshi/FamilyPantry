import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

export const groceryLists = pgTable("grocery_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shareId: text("share_id").notNull().default(() => nanoid(10)),
});

export const groceryItems = pgTable("grocery_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  purchased: boolean("purchased").notNull().default(false),
  category: text("category"),
});

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold"),
  category: text("category"),
});

export const insertGroceryListSchema = createInsertSchema(groceryLists).pick({
  name: true,
});

export const insertGroceryItemSchema = createInsertSchema(groceryItems)
  .pick({
    listId: true,
    name: true,
    quantity: true,
    category: true,
  })
  .extend({
    quantity: z.number().min(1),
  });

export const insertInventoryItemSchema = createInsertSchema(inventoryItems)
  .pick({
    name: true,
    quantity: true,
    lowStockThreshold: true,
    category: true,
  })
  .extend({
    quantity: z.number().min(0),
    lowStockThreshold: z.number().min(0).optional(),
  });

export type GroceryList = typeof groceryLists.$inferSelect;
export type GroceryItem = typeof groceryItems.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;

export type InsertGroceryList = z.infer<typeof insertGroceryListSchema>;
export type InsertGroceryItem = z.infer<typeof insertGroceryItemSchema>;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
