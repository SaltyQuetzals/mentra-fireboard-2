import { useState, useEffect } from "react";
import { Key } from "lucide-react";
import { Badge, Input, Button } from "../../components/ui";

interface HomePageProps {
  userId: string;
}

export default function HomePage({ userId }: HomePageProps) {
  const [apiKey, setApiKey] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/fireboard-api-key?userId=${encodeURIComponent(userId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) {
          setApiKey(data.apiKey);
          setApiKeyInput(data.apiKey);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [userId]);

  const handleSetApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
    fetch("/api/fireboard-api-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, apiKey: newApiKey }),
    }).catch(() => {});
  };

  const handleSaveApiKey = () => {
    setIsSaving(true);
    handleSetApiKey(apiKeyInput);
    setTimeout(() => setIsSaving(false), 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Key className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Fireboard</h1>
            <p className="text-xs text-muted-foreground">MentraOS</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-xs">
            {userId?.substring(0, 8)}...
          </Badge>
          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder="Fireboard API Key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-64 h-8 text-sm"
            />
            <Button size="sm" onClick={handleSaveApiKey} disabled={isSaving}>
              {isSaving ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
