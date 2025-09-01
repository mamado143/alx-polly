"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const updatePollSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters").max(280, "Question must be less than 280 characters"),
  options: z
    .array(z.string().min(1, "Option cannot be empty").max(80, "Option must be less than 80 characters"))
    .min(2, "Must have at least 2 options")
    .max(10, "Cannot have more than 10 options")
    .refine(
      (options) => {
        const trimmed = options.map(opt => opt.trim().toLowerCase());
        return new Set(trimmed).size === trimmed.length;
      },
      { message: "Options must be unique (case-insensitive)" }
    ),
  expiresAt: z.string().optional().transform((val) => {
    if (!val) return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }),
});

type UpdatePollResult = 
  | { ok: true; data: { id: string; question: string } }
  | { ok: false; error: string };

export async function updatePoll(pollId: string, input: unknown): Promise<UpdatePollResult> {
  const parsed = updatePollSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message || "Invalid input" };
  }

  const supabase = await createClient();
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
      return { ok: false, error: "You can only edit your own polls" };
    }

    // Trim and deduplicate options
    const cleanOptions = parsed.data.options
      .map(opt => opt.trim())
      .filter((opt, index, arr) => 
        arr.findIndex(item => item.toLowerCase() === opt.toLowerCase()) === index
      );

    const { data, error } = await supabase
      .from("polls")
      .update({
        question: parsed.data.question.trim(),
        options: cleanOptions,
        expires_at: parsed.data.expiresAt ?? null,
      })
      .eq("id", pollId)
      .select("id, question")
      .single();

    if (error) throw error;

    // Revalidate the polls list
    revalidatePath("/polls");
    revalidatePath(`/polls/${pollId}`);
    
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message ?? "Failed to update poll" };
  }
}

// Server Action that handles redirect after successful update
export async function updatePollAndRedirect(pollId: string, input: unknown) {
  const result = await updatePoll(pollId, input);
  
  if (result.ok) {
    redirect(`/polls?updated=true`);
  }
  
  return result;
}
