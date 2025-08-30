"use client";

type Props = { pollSlug: string };

export default function VoteResults({ pollSlug }: Props) {
  return (
    <div className="text-sm text-muted-foreground">
      Live results placeholder for <b>{pollSlug}</b>. We'll subscribe to Supabase
      Realtime here later.
    </div>
  );
}
