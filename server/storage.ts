import {
  type GroceryList,
  type GroceryItem,
  type InventoryItem,
  type InsertGroceryList,
  type InsertGroceryItem,
  type InsertInventoryItem,
} from "@shared/schema";
import { nanoid } from "nanoid";
import { getCollection, getDb } from "./mongo";
import { Collection, ObjectId } from "mongodb";

export interface IStorage {
  // Grocery Lists
  createList(list: InsertGroceryList): Promise<GroceryList>;
  getList(_id: number): Promise<GroceryList | undefined>;
  getListByShareId(shareId: string): Promise<GroceryList | undefined>;
  getAllLists(): Promise<GroceryList[]>;

  // Grocery Items
  addItemToList(item: InsertGroceryItem): Promise<GroceryItem>;
  getListItems(listId: number): Promise<GroceryItem[]>;
  updateItemPurchased(
    itemId: number,
    purchased: boolean
  ): Promise<{ groceryItem: GroceryItem; inventoryItem?: InventoryItem }>;
  deleteListItem(itemId: number): Promise<void>;

  // Inventory
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  getAllInventoryItems(): Promise<InventoryItem[]>;
  updateInventoryQuantity(itemId: number, quantity: number): Promise<InventoryItem>;
  deleteInventoryItem(itemId: number): Promise<void>;
  getInventoryItemByName(name: string): Promise<InventoryItem | undefined>;
}

export class MongoStorage implements IStorage {
  // Helper: emulate auto-increment numeric IDs using a "counters" collection.
  private async getNextSequence(seqName: string): Promise<number> {
    const db = getDb();
    const counters = db.collection("counters");
    const result = await counters.findOneAndUpdate(
      { _id: seqName },
      { $inc: { seq: 1 } },
      { upsert: true, returnOriginal: false }
    );
    if (!result) {
      // As a fallback, try to fetch the document directly.
      const doc = await counters.findOne({ _id: seqName });
      if (doc && doc.seq !== undefined) {
        return doc.seq;
      }
      throw new Error(`Failed to get sequence for ${seqName}`);
    }
    return result.value?.seq;
  }
  
  // Grocery Lists
  async createList(list: InsertGroceryList): Promise<GroceryList> {
    const listsCollection = getCollection<GroceryList>("lists");
    const _id = await this.getNextSequence("lists");
    const shareId = nanoid(10);
    const newList: GroceryList = { _id, shareId, ...list };
    await listsCollection.insertOne(newList);
    return newList;
  }

  async getList(_id: number): Promise<GroceryList | undefined> {
    const listsCollection = getCollection<GroceryList>("lists");
    return await listsCollection.findOne({ _id });
  }

  async getListByShareId(shareId: string): Promise<GroceryList | undefined> {
    const listsCollection = getCollection<GroceryList>("lists");
    return await listsCollection.findOne({ shareId });
  }

  async getAllLists(): Promise<GroceryList[]> {
    const listsCollection = getCollection<GroceryList>("lists");
    return await listsCollection.find().toArray();
  }

  // Grocery Items
  async addItemToList(item: InsertGroceryItem): Promise<GroceryItem> {
    const itemsCollection = getCollection<GroceryItem>("items");
    const _id = await this.getNextSequence("items");
    const newItem: GroceryItem = {
      _id,
      purchased: false,
      ...item,
      category: item.category || null,
    };
    await itemsCollection.insertOne(newItem);
    return newItem;
  }

  async getListItems(listId: number): Promise<GroceryItem[]> {
    const itemsCollection = getCollection<GroceryItem>("items");
    return await itemsCollection.find({ listId }).toArray();
  }

  async updateItemPurchased(
    itemId: ObjectId,
    purchased: boolean
  ): Promise<{ groceryItem: GroceryItem; inventoryItem?: InventoryItem }> {
    const itemsCollection = getCollection<GroceryItem>("items");
    console.log(itemId)
    const updateResult = await itemsCollection.findOneAndUpdate(
      { _id: itemId },
      { $set: { purchased } },
      { returnDocument: "after" }
    );
    console.log(updateResult,'updatetd result')
    if (!updateResult) throw new Error("Item not found");
    const updatedItem = updateResult;

    let inventoryItem: InventoryItem | undefined;
    if (purchased) {
      inventoryItem = await this.getInventoryItemByName(updatedItem.name);
      if (inventoryItem) {
        inventoryItem = await this.updateInventoryQuantity(
          inventoryItem._id,
          inventoryItem.quantity + updatedItem.quantity
        );
      } else {
        inventoryItem = await this.createInventoryItem({
          name: updatedItem.name,
          quantity: updatedItem.quantity,
          category: updatedItem.category || null,
          lowStockThreshold: 1,
        });
      }
      return { groceryItem: updatedItem, inventoryItem };
    }
    return { groceryItem: updatedItem };
  }

  async deleteListItem(itemId: number): Promise<void> {
    const itemsCollection = getCollection<GroceryItem>("items");
    await itemsCollection.deleteOne({ _id: itemId });
  }

  // Inventory
  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const inventoryCollection = getCollection<InventoryItem>("inventory");
    const _id = await this.getNextSequence("inventory");
    const newItem: InventoryItem = {
      _id,
      ...item,
      category: item.category || null,
      lowStockThreshold: item.lowStockThreshold || null,
    };
    await inventoryCollection.insertOne(newItem);
    return newItem;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    const inventoryCollection = getCollection<InventoryItem>("inventory");
    return await inventoryCollection.find().toArray();
  }

  async updateInventoryQuantity(itemId: number, quantity: number): Promise<InventoryItem> {
    const inventoryCollection = getCollection<InventoryItem>("inventory");
    const result = await inventoryCollection.findOneAndUpdate(
      { _id: itemId },
      { $set: { quantity } },
      { returnDocument: "after" }
    );
    if (!result) throw new Error("Inventory item not found");
    return result;
  }

  async deleteInventoryItem(itemId: number): Promise<void> {
    const inventoryCollection = getCollection<InventoryItem>("inventory");
    await inventoryCollection.deleteOne({ _id: itemId });
  }

  async getInventoryItemByName(name: string): Promise<InventoryItem | undefined> {
    const inventoryCollection = getCollection<InventoryItem>("inventory");
    return await inventoryCollection.findOne({ name });
  }
}

// Export an instance that will be used by your routes.
export const storage = new MongoStorage();
