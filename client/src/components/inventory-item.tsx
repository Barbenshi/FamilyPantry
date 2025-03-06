import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryItem } from "@shared/schema";

interface InventoryItemProps {
  item: InventoryItem;
}

export function InventoryItemCard({ item }: InventoryItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateQuantity = useMutation({
    mutationFn: async (newQuantity: number) => {
      const res = await apiRequest("PATCH", `/api/inventory/${item.id}/quantity`, {
        quantity: newQuantity,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/inventory/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        description: "Item removed from inventory",
      });
    },
  });

  const isLowStock = item.lowStockThreshold !== null && 
                    item.quantity <= (item.lowStockThreshold || 0);

  return (
    <Card className={isLowStock ? "border-destructive" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-muted-foreground">
              {item.category && `Category: ${item.category}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteItem.mutate()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateQuantity.mutate(Math.max(0, item.quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateQuantity.mutate(item.quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {isLowStock && (
            <span className="text-sm text-destructive">Low Stock</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
