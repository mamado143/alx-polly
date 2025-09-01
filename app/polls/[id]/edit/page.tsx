import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditPollForm } from "@/components/polls/EditPollForm";

interface EditPollPageProps {
  params: {
    id: string;
  };
}

export default async function EditPollPage({ params }: EditPollPageProps) {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Fetch the poll
  const { data: poll, error } = await supabase
    .from("polls")
    .select("id, question, options, expires_at, created_by")
    .eq("id", params.id)
    .single();

  if (error || !poll) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">
              Poll not found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user owns the poll
  if (poll.created_by !== user.id) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">
              You can only edit your own polls.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Poll</CardTitle>
        </CardHeader>
        <CardContent>
          <EditPollForm poll={poll} />
        </CardContent>
      </Card>
    </div>
  );
}
