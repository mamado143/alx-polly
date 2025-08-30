import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import QRCodeCard from "@/components/QRCodeCard";
import VoteResults from "@/components/VoteResults";

export default function PublicPollPage({
  params: { slug },
}: { params: { slug: string } }) {
  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/polls/${slug}`;
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Poll: {slug}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Placeholder public poll page. Voting UI will appear here.
          </p>
          <div className="mt-4">
            <QRCodeCard url={shareUrl} />
          </div>
          <div className="mt-6">
            <VoteResults pollSlug={slug} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
