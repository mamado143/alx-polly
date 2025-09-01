"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { submitVote } from "@/lib/actions/submit-vote";
import { CheckCircle, Vote } from "lucide-react";

const voteSchema = z.object({
  optionIndex: z.number().min(0, "Please select an option"),
});

type VoteData = z.infer<typeof voteSchema>;

interface PollVotingFormProps {
  pollId: string;
  options: string[];
}

export function PollVotingForm({ pollId, options }: PollVotingFormProps) {
  const [pending, startTransition] = useTransition();
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const form = useForm<VoteData>({
    resolver: zodResolver(voteSchema),
    defaultValues: {
      optionIndex: -1,
    },
  });

  const onSubmit = (values: VoteData) => {
    startTransition(async () => {
      const result = await submitVote(pollId, values.optionIndex);
      
      if (result.ok) {
        setHasVoted(true);
        setSelectedOption(values.optionIndex);
      } else {
        form.setError("root", {
          message: result.error,
        });
      }
    });
  };

  if (hasVoted) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            Thank you for voting!
          </h3>
          <p className="text-muted-foreground">
            You voted for: <strong>{options[selectedOption!]}</strong>
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Your vote has been recorded. Results are updated in real-time.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="optionIndex"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Select your choice:</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value.toString()}
                  className="space-y-3"
                >
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <label
                        htmlFor={`option-${index}`}
                        className="flex-1 p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
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

        <Button 
          type="submit" 
          disabled={pending || form.watch("optionIndex") === -1} 
          className="w-full"
        >
          <Vote className="h-4 w-4 mr-2" />
          {pending ? "Submitting Vote..." : "Submit Vote"}
        </Button>
      </form>
    </Form>
  );
}
