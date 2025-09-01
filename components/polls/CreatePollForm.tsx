"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPollAndRedirect } from "@/lib/actions/create-poll";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Calendar } from "lucide-react";

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
  expiresAt: z.string().optional().transform((val) => {
    if (!val) return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }).refine((date) => {
    if (!date) return true;
    return date > new Date();
  }, { message: "Expiration date must be in the future" }),
});

type CreatePollData = z.infer<typeof createPollSchema>;

export function CreatePollForm() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  
  const form = useForm<CreatePollData>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      question: "",
      options: ["", ""],
      expiresAt: "",
    },
  });

  const { fields, append, remove } = form.useFieldArray({
    control: form.control,
    name: "options",
  });

  const onSubmit = (values: CreatePollData) => {
    startTransition(async () => {
      const result = await createPollAndRedirect(values);
      
      if (!result.ok) {
        // Handle error - could use toast or form error
        form.setError("root", {
          message: result.error,
        });
      }
      // If successful, the redirect will happen automatically
    });
  };

  const addOption = () => {
    if (fields.length < 10) {
      append("");
    }
  };

  const removeOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poll Question</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What would you like to ask?"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Poll Options</FormLabel>
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <FormField
                control={form.control}
                name={`options.${index}`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder={`Option ${index + 1}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeOption(index)}
                disabled={fields.length <= 2 || pending}
                className={cn(
                  fields.length <= 2 && "opacity-50 cursor-not-allowed"
                )}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addOption}
            disabled={fields.length >= 10 || pending}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>

        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiration Date (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating Poll..." : "Create Poll"}
        </Button>
      </form>
    </Form>
  );
}
