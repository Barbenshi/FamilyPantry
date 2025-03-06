import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ListChecks, Package } from "lucide-react";

export function NavBar() {
  const [location] = useLocation();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <a className="text-xl font-semibold text-primary">FamilyGrocery</a>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <a className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md",
                  location === "/" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}>
                  <ListChecks size={20} />
                  <span>Lists</span>
                </a>
              </Link>
              <Link href="/inventory">
                <a className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-md",
                  location === "/inventory" ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}>
                  <Package size={20} />
                  <span>Inventory</span>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
