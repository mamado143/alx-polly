import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeCard } from "@/components/shared/QRCodeCard";
import VoteResults from "@/components/VoteResults";
import { createClient } from "@/lib/supabase/server";

interface PollPageProps {
  params: { slug: string };
}

export default async function PublicPollPage({
  params: { slug },
}: PollPageProps) {
  const supabase = createClient();
  
  // Fetch poll data from Supabase
  const { data: poll, error } = await supabase
    .from("polls")
    .select("id, question, options, created_at, expires_at")
    .eq("id", slug)
    .single();

  if (error || !poll) {
    notFound();
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/polls/${slug}`;
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{poll.question}</CardTitle>
          {isExpired && (
            <p className="text-sm text-red-600">This poll has expired</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Options:</h3>
            <div className="space-y-2">
              {poll.options.map((option: string, index: number) => (
                <div key={index} className="p-3 border rounded-md">
                  {option}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Share this poll</h3>
              <QRCodeCard url={shareUrl} title="Scan to vote" />
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Live Results</h3>
              <VoteResults pollSlug={slug} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
