import {
  type GroceryList,
  type GroceryItem,
  type InventoryItem,
  type InsertGroceryList,
  type InsertGroceryItem,
  type InsertInventoryItem,
} from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // Grocery Lists
  createList(list: InsertGroceryList): Promise<GroceryList>;
  getList(id: number): Promise<GroceryList | undefined>;
  getListByShareId(shareId: string): Promise<GroceryList | undefined>;
  getAllLists(): Promise<GroceryList[]>;

  // Grocery Items
  addItemToList(item: InsertGroceryItem): Promise<GroceryItem>;
  getListItems(listId: number): Promise<GroceryItem[]>;
  updateItemPurchased(itemId: number, purchased: boolean): Promise<{groceryItem: GroceryItem, inventoryItem?: InventoryItem}>;
  deleteListItem(itemId: number): Promise<void>;

  // Inventory
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  updateInventoryQuantity(itemId: number, quantity: number): Promise<InventoryItem>;
  deleteInventoryItem(itemId: number): Promise<void>;
  getInventoryItemByName(name: string): Promise<InventoryItem | undefined>;
}

export class MemStorage implements IStorage {
  private lists: Map<number, GroceryList>;
  private items: Map<number, GroceryItem>;
  private inventory: Map<number, InventoryItem>;
  private currentListId: number;
  private currentItemId: number;
  private currentInventoryId: number;

  constructor() {
    this.lists = new Map();
    this.items = new Map();
    this.inventory = new Map();
    this.currentListId = 1;
    this.currentItemId = 1;
    this.currentInventoryId = 1;
  }

  async createList(list: InsertGroceryList): Promise<GroceryList> {
    const id = this.currentListId++;
    const newList: GroceryList = {
      id,
      shareId: nanoid(10),
      ...list,
    };
    this.lists.set(id, newList);
    return newList;
  }

  async getList(id: number): Promise<GroceryList | undefined> {
    return this.lists.get(id);
  }

  async getListByShareId(shareId: string): Promise<GroceryList | undefined> {
    return Array.from(this.lists.values()).find(list => list.shareId === shareId);
  }

  async getAllLists(): Promise<GroceryList[]> {
    return Array.from(this.lists.values());
  }

  async addItemToList(item: InsertGroceryItem): Promise<GroceryItem> {
    const id = this.currentItemId++;
    const newItem: GroceryItem = {
      id,
      purchased: false,
      ...item,
      category: item.category || null,
    };
    this.items.set(id, newItem);
    return newItem;
  }

  async getListItems(listId: number): Promise<GroceryItem[]> {
    return Array.from(this.items.values()).filter(item => item.listId === listId);
  }

  async getInventoryItemByName(name: string): Promise<InventoryItem | undefined> {
    return Array.from(this.inventory.values()).find(item => item.name === name);
  }

  async updateItemPurchased(itemId: number, purchased: boolean): Promise<{groceryItem: GroceryItem, inventoryItem?: InventoryItem}> {
    const item = this.items.get(itemId);
    if (!item) throw new Error("Item not found");

    const updatedItem = { ...item, purchased };
    this.items.set(itemId, updatedItem);

    // If item is marked as purchased, update inventory
    if (purchased) {
      let inventoryItem = await this.getInventoryItemByName(item.name);

      if (inventoryItem) {
        // Update existing inventory item
        inventoryItem = await this.updateInventoryQuantity(
          inventoryItem.id,
          inventoryItem.quantity + item.quantity
        );
      } else {
        // Create new inventory item
        inventoryItem = await this.createInventoryItem({
          name: item.name,
          quantity: item.quantity,
          category: item.category || null,
          lowStockThreshold: 1,
        });
      }

      return { groceryItem: updatedItem, inventoryItem };
    }

    return { groceryItem: updatedItem };
  }

  async deleteListItem(itemId: number): Promise<void> {
    this.items.delete(itemId);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.currentInventoryId++;
    const newItem: InventoryItem = {
      id,
      ...item,
      category: item.category || null,
      lowStockThreshold: item.lowStockThreshold || null,
    };
    this.inventory.set(id, newItem);
    return newItem;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventory.values());
  }

  async updateInventoryQuantity(itemId: number, quantity: number): Promise<InventoryItem> {
    const item = this.inventory.get(itemId);
    if (!item) throw new Error("Inventory item not found");

    const updatedItem = { ...item, quantity };
    this.inventory.set(itemId, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(itemId: number): Promise<void> {
    this.inventory.delete(itemId);
  }
}

export const storage = new MemStorage();