import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import type { GroceryItem } from "@shared/schema";

interface GroceryListProps {
  listId: number;
  items: GroceryItem[];
  isShared?: boolean;
}

export function GroceryList({ listId, items, isShared = false }: GroceryListProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addItem = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/lists/${listId}/items`, {
        name: newItemName,
        quantity: newItemQuantity,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lists/${listId}/items`] });
      setNewItemName("");
      setNewItemQuantity(1);
      toast({
        description: "Item added to list",
      });
    },
  });

  const togglePurchased = useMutation({
    mutationFn: async (item: GroceryItem) => {
      const res = await apiRequest("PATCH", `/api/items/${item.id}/purchased`, {
        purchased: !item.purchased,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lists/${listId}/items`] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest("DELETE", `/api/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lists/${listId}/items`] });
      toast({
        description: "Item removed from list",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shopping List</CardTitle>
      </CardHeader>
      <CardContent>
        {!isShared && (
          <div className="flex space-x-2 mb-4">
            <Input
              placeholder="Add item..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <Input
              type="number"
              className="w-24"
              min={1}
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
            />
            <Button
              size="icon"
              onClick={() => addItem.mutate()}
              disabled={!newItemName || addItem.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={item.purchased}
                  onCheckedChange={() => togglePurchased.mutate(item)}
                  disabled={isShared}
                />
                <span className={item.purchased ? "line-through text-muted-foreground" : ""}>
                  {item.name} ({item.quantity})
                </span>
              </div>
              {!isShared && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteItem.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
