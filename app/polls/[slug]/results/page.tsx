import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PollResultsPage({
  params: { slug },
}: { params: { slug: string } }) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Results for: {slug}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Placeholder results page (creator view). Live chart will go here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
