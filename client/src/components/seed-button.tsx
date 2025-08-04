import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database } from "lucide-react";

export function SeedButton() {
  const { toast } = useToast();

  const seedMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/seed-test-data", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to seed test data");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test data has been seeded successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to seed test data",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      onClick={() => seedMutation.mutate()}
      disabled={seedMutation.isPending}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Database className="h-4 w-4" />
      {seedMutation.isPending ? "Seeding..." : "Seed Test Data"}
    </Button>
  );
}