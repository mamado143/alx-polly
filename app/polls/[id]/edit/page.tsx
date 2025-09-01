import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditPollForm } from "@/components/polls/EditPollForm";
import { EditablePoll } from "@/lib/types/poll";

interface EditPollPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPollPage({ params }: EditPollPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Fetch the poll
  const { data: poll, error } = await supabase
    .from("polls")
    .select("id, question, options, expires_at, created_by")
    .eq("id", id)
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

  // Transform poll data for editing
  const editablePoll: EditablePoll = {
    id: poll.id,
    question: poll.question,
    options: poll.options,
    expires_at: poll.expires_at,
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Poll</CardTitle>
        </CardHeader>
        <CardContent>
          <EditPollForm poll={editablePoll} />
        </CardContent>
      </Card>
    </div>
  );
}
