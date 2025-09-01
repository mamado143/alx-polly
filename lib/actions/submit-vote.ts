"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SubmitVoteResult = 
  | { ok: true }
  | { ok: false; error: string };

export async function submitVote(pollId: string, optionIndex: number): Promise<SubmitVoteResult> {
  const supabase = await createClient();
  
  try {
    // Check if poll exists and is not expired
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("id, options, expires_at")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      return { ok: false, error: "Poll not found" };
    }

    // Check if poll is expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      return { ok: false, error: "This poll has expired" };
    }

    // Validate option index
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return { ok: false, error: "Invalid option selected" };
    }

    // Get current user (optional for anonymous voting)
    const { data: { user } } = await supabase.auth.getUser();

    // Check if user has already voted (if authenticated)
    if (user) {
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", pollId)
        .eq("voter_id", user.id)
        .single();

      if (existingVote) {
        return { ok: false, error: "You have already voted on this poll" };
      }
    }

    // Submit the vote
    const { error: voteError } = await supabase
      .from("votes")
      .insert({
        poll_id: pollId,
        option_index: optionIndex,
        voter_id: user?.id || null, // Allow anonymous voting
      });

    if (voteError) {
      // Handle unique constraint violation (user already voted)
      if (voteError.code === '23505') {
        return { ok: false, error: "You have already voted on this poll" };
      }
      throw voteError;
    }

    // Revalidate the poll page and results
    revalidatePath(`/polls/${pollId}`);
    revalidatePath(`/polls/${pollId}/results`);
    
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message ?? "Failed to submit vote" };
  }
}
