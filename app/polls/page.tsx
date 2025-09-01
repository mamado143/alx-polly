import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Calendar, Users, CheckCircle, Eye, Share2, BarChart3, Edit, Trash2 } from "lucide-react";
import { SuccessMessage } from "@/components/SuccessMessage";
import { Poll } from "@/lib/types/poll";

export default async function PollsDashboardPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Please log in to view your polls.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all polls with creator information
  const { data: polls, error } = await supabase
    .from("polls")
    .select(`
      id, 
      question, 
      options, 
      created_at, 
      expires_at,
      created_by
    `)
    .order("created_at", { ascending: false });

  // Note: We can't directly query auth.users from the client
  // For now, we'll just show "You" for the current user's polls

  // Fetch vote counts for each poll
  const pollIds = polls?.map(poll => poll.id) || [];
  const { data: voteCounts } = await supabase
    .from("votes")
    .select("poll_id")
    .in("poll_id", pollIds);

  // Calculate statistics
  const totalPolls = polls?.length || 0;
  const totalVotes = voteCounts?.length || 0;
  const activePolls = polls?.filter(poll => 
    !poll.expires_at || new Date(poll.expires_at) > new Date()
  ).length || 0;
  const userPolls = polls?.filter(poll => poll.created_by === user.id).length || 0;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-600">
              Error loading polls: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <SuccessMessage />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Polls</h1>
        <Link href="/polls/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Poll
          </Button>
        </Link>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Polls</p>
                <p className="text-2xl font-bold">{totalPolls}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Polls</p>
                <p className="text-2xl font-bold">{userPolls}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Votes</p>
                <p className="text-2xl font-bold">{totalVotes}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Polls</p>
                <p className="text-2xl font-bold">{activePolls}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {polls && polls.length > 0 ? (
        <div className="space-y-4">
          {polls.map((poll) => {
            const pollVoteCount = voteCounts?.filter(vote => vote.poll_id === poll.id).length || 0;
            const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
            const isOwner = poll.created_by === user.id;
            
            return (
            <Card key={poll.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{poll.question}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created by {isOwner ? 'You' : 'Another user'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {pollVoteCount} votes
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      {poll.options.length} options
                    </div>
                    {isExpired && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Expired
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {poll.options.map((option: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-muted rounded text-sm"
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>
                        Created {new Date(poll.created_at).toLocaleDateString()}
                      </span>
                      {poll.expires_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Expires {new Date(poll.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link href={`/polls/${poll.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/polls/${poll.id}/results`}>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Results
                        </Button>
                      </Link>
                      {isOwner && (
                        <>
                          <Link href={`/polls/${poll.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <form action={`/polls/${poll.id}/delete`} method="post" className="inline">
                            <Button 
                              type="submit" 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              You haven't created any polls yet.
            </p>
            <Link href="/polls/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Poll
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
