import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { PollVotingForm } from "@/components/polls/PollVotingForm";
import { PollResults } from "@/components/polls/PollResults";
import { QRCodeCard } from "@/components/shared/QRCodeCard";
import { Calendar, Users, Clock } from "lucide-react";

interface PollPageProps {
  params: Promise<{ id: string }>;
}

export default async function PollDetailPage({ params }: PollPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Fetch poll data from Supabase
  const { data: poll, error } = await supabase
    .from("polls")
    .select("id, question, options, created_at, expires_at")
    .eq("id", id)
    .single();

  if (error || !poll) {
    notFound();
  }

  // Check if poll is expired
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
  
  // Get vote count for this poll
  const { count: voteCount } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("poll_id", id);

  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/polls/${id}`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Poll Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{poll.question}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {voteCount || 0} votes
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Created {new Date(poll.created_at).toLocaleDateString()}
                </div>
                {poll.expires_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Expires {new Date(poll.expires_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            {isExpired && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                Expired
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Voting Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cast Your Vote</CardTitle>
            </CardHeader>
            <CardContent>
              {isExpired ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    This poll has expired and is no longer accepting votes.
                  </p>
                  <PollResults pollId={id} />
                </div>
              ) : (
                <PollVotingForm pollId={id} options={poll.options} />
              )}
            </CardContent>
          </Card>

          {/* Share Section */}
          <Card>
            <CardHeader>
              <CardTitle>Share This Poll</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeCard url={shareUrl} title="Scan to vote" />
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Live Results</CardTitle>
            </CardHeader>
            <CardContent>
              <PollResults pollId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
