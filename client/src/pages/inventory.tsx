import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InventoryItemCard } from "@/components/inventory-item";
import { apiRequest } from "@/lib/queryClient";

export default function Inventory() {
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemThreshold, setNewItemThreshold] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inventory = useQuery({
    queryKey: ["/api/inventory"],
  });

  const createItem = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/inventory", {
        name: newItemName,
        quantity: newItemQuantity,
        lowStockThreshold: newItemThreshold,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setNewItemName("");
      setNewItemQuantity(1);
      setNewItemThreshold(1);
      toast({
        description: "Item added to inventory",
      });
    },
  });

  if (inventory.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Item name..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="text-sm">Quantity</label>
                  <Input
                    type="number"
                    min={0}
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm">Low Stock Threshold</label>
                  <Input
                    type="number"
                    min={0}
                    value={newItemThreshold}
                    onChange={(e) => setNewItemThreshold(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => createItem.mutate()}
                disabled={!newItemName || createItem.isPending}
              >
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {inventory.data?.map((item) => (
          <InventoryItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
