/**
 * Poll-related type definitions
 */

// Base poll type from database
export interface Poll {
  id: string;
  question: string;
  options: string[];
  created_by: string;
  created_at: string;
  expires_at: string | null;
}

// Poll with additional computed fields
export interface PollWithStats extends Poll {
  vote_count: number;
  is_expired: boolean;
  created_by_email?: string;
}

// Poll data for editing (used in EditPollForm)
export interface EditablePoll {
  id: string;
  question: string;
  options: string[];
  expires_at: string | null;
}

// Poll data for creation form
export interface CreatePollData {
  question: string;
  options: string[];
  expiresAt?: string;
}

// Poll data for update form
export interface UpdatePollData {
  question: string;
  options: string[];
  expiresAt?: string;
}

// Poll result data for display
export interface PollResult {
  option: string;
  votes: number;
  percentage: number;
}

// Poll with results
export interface PollWithResults extends Poll {
  results: PollResult[];
  total_votes: number;
}

// Vote data
export interface Vote {
  id: string;
  poll_id: string;
  option_index: number;
  voter_id: string | null;
  created_at: string;
}

// Poll creation result
export interface CreatePollResult {
  ok: true;
  data: {
    id: string;
    question: string;
  };
} | {
  ok: false;
  error: string;
}

// Poll update result
export interface UpdatePollResult {
  ok: true;
  data: {
    id: string;
    question: string;
  };
} | {
  ok: false;
  error: string;
}

// Poll deletion result
export interface DeletePollResult {
  ok: true;
} | {
  ok: false;
  error: string;
}

// Vote submission result
export interface SubmitVoteResult {
  ok: true;
} | {
  ok: false;
  error: string;
}
