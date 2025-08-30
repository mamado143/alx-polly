import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PollsDashboardPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Polls</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Placeholder dashboard. We'll list the creator's polls here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
