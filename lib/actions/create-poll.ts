"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const createPollSchema = z.object({
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
  expiresAt: z.union([z.date(), z.null()]).optional(),
});

type CreatePollResult = 
  | { ok: true; data: { id: string; question: string } }
  | { ok: false; error: string };

export async function createPoll(input: unknown): Promise<CreatePollResult> {
  const parsed = createPollSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message || "Invalid input" };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    // Trim and deduplicate options
    const cleanOptions = parsed.data.options
      .map(opt => opt.trim())
      .filter((opt, index, arr) => 
        arr.findIndex(item => item.toLowerCase() === opt.toLowerCase()) === index
      );

    const { data, error } = await supabase
      .from("polls")
      .insert({
        question: parsed.data.question.trim(),
        options: cleanOptions,
        created_by: user.id,
        expires_at: parsed.data.expiresAt ?? null,
      })
      .select("id, question")
      .single();

    if (error) throw error;

    // Revalidate the polls list
    revalidatePath("/polls");
    
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to create poll" };
  }
}

// Server Action that handles redirect after successful creation
export async function createPollAndRedirect(input: unknown) {
  const result = await createPoll(input);
  
  if (result.ok) {
    redirect(`/polls?created=true`);
  }
  
  return result;
}