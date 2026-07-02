import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">🎲</div>
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground">
          This page doesn't exist.
        </p>
        <Button onClick={() => navigate("/lobby")}>
          Back to Lobby
        </Button>
      </div>
    </div>
  );
}