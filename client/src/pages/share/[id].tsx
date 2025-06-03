import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { GroceryList } from "@/components/grocery-list";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { type GroceryList as GroceryListType, type GroceryItem } from "@shared/schema";

interface SharedListResponse {
  list: GroceryListType;
  items: GroceryItem[];
}

export default function SharedList() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<SharedListResponse>({
    queryKey: [`/api/share/${id}`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading shared list...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              List not found or has been deleted
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{data.list.name} (Shared List)</h1>
        <GroceryList listId={data.list._id} isShared={true} />
      </div>
    </div>
  );
}
