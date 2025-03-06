import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Share2 } from "lucide-react";
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
import { GroceryList } from "@/components/grocery-list";
import { apiRequest } from "@/lib/queryClient";
import type { GroceryList as GroceryListType } from "@shared/schema";

export default function Lists() {
  const [newListName, setNewListName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lists = [], isLoading } = useQuery<GroceryListType[]>({
    queryKey: ["/api/lists"],
  });

  const createList = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/lists", {
        name: newListName,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lists"] });
      setNewListName("");
      toast({
        description: "New list created",
      });
    },
  });

  const copyShareLink = (shareId: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/share/${shareId}`);
    toast({
      description: "Share link copied to clipboard",
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Shopping Lists</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
            </DialogHeader>
            <div className="flex space-x-2">
              <Input
                placeholder="List name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              <Button
                onClick={() => createList.mutate()}
                disabled={!newListName || createList.isPending}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <div key={list.id} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{list.name}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyShareLink(list.shareId)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <GroceryList listId={list.id} />
          </div>
        ))}
      </div>
    </div>
  );
}