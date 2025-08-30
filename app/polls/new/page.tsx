import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PollForm from "@/components/PollForm";

export default function NewPollPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Poll</CardTitle>
        </CardHeader>
        <CardContent>
          <PollForm />
        </CardContent>
      </Card>
    </div>
  );
}
