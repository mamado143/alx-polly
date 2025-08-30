import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatePollForm } from "@/components/polls/CreatePollForm";

export default function NewPollPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Poll</CardTitle>
        </CardHeader>
        <CardContent>
          <CreatePollForm />
        </CardContent>
      </Card>
    </div>
  );
}
