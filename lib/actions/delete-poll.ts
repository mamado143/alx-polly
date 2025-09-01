"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type DeletePollResult = 
  | { ok: true }
  | { ok: false; error: string };

export async function deletePoll(pollId: string): Promise<DeletePollResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    // Check if poll exists and user owns it
    const { data: existingPoll, error: fetchError } = await supabase
      .from("polls")
      .select("id, created_by")
      .eq("id", pollId)
      .single();

    if (fetchError || !existingPoll) {
      return { ok: false, error: "Poll not found" };
    }

    if (existingPoll.created_by !== user.id) {
      return { ok: false, error: "You can only delete your own polls" };
    }

    // Delete the poll (votes will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from("polls")
      .delete()
      .eq("id", pollId);

    if (error) throw error;

    // Revalidate the polls list
    revalidatePath("/polls");
    
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to delete poll" };
  }
}

// Server Action that handles redirect after successful deletion
export async function deletePollAndRedirect(pollId: string) {
  const result = await deletePoll(pollId);
  
  if (result.ok) {
    redirect(`/polls?deleted=true`);
  }
  
  return result;
}
