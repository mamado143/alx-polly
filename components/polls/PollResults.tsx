"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users } from "lucide-react";

interface PollResultsProps {
  pollId: string;
}

interface VoteResult {
  option_index: number;
  option_text: string;
  vote_count: number;
}

export function PollResults({ pollId }: PollResultsProps) {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const supabase = createClient();
        
        // Use the database function to get poll results
        const { data, error } = await supabase.rpc('get_poll_results', {
          poll_uuid: pollId
        });

        if (error) {
          console.error('Error fetching results:', error);
          setError('Failed to load results');
          return;
        }

        if (data) {
          setResults(data);
          const total = data.reduce((sum: number, result: VoteResult) => sum + result.vote_count, 0);
          setTotalVotes(total);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();

    // Set up real-time subscription for live updates
    const supabase = createClient();
    const channel = supabase
      .channel('poll-results')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `poll_id=eq.${pollId}`,
        },
        () => {
          // Refetch results when votes change
          fetchResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm">Loading results...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No votes yet</p>
        <p className="text-sm text-muted-foreground">Be the first to vote!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="h-4 w-4" />
        <span className="text-sm">{totalVotes} total votes</span>
      </div>
      
      <div className="space-y-3">
        {results.map((result) => {
          const percentage = totalVotes > 0 ? (result.vote_count / totalVotes) * 100 : 0;
          
          return (
            <div key={result.option_index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{result.option_text}</span>
                <span className="text-sm text-muted-foreground">
                  {result.vote_count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
