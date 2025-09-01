import { createClient } from '@/lib/supabase/server'

// Mock user data
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
}

// Mock poll data
export const mockPoll = {
  id: 'poll-123',
  question: 'What is your favorite programming language?',
  options: ['JavaScript', 'TypeScript', 'Python', 'Go'],
  created_by: 'user-123',
  created_at: '2024-01-01T00:00:00Z',
  expires_at: null,
}

// Mock vote data
export const mockVote = {
  id: 'vote-123',
  poll_id: 'poll-123',
  option_index: 0,
  voter_id: 'user-123',
  created_at: '2024-01-01T00:00:00Z',
}

// Mock Supabase responses
export const mockSupabaseResponses = {
  getUser: {
    success: { data: { user: mockUser }, error: null },
    failure: { data: { user: null }, error: null },
  },
  getPoll: {
    success: { data: mockPoll, error: null },
    failure: { data: null, error: { message: 'Poll not found' } },
  },
  createPoll: {
    success: { 
      data: { id: 'poll-123', question: mockPoll.question }, 
      error: null 
    },
    failure: { 
      data: null, 
      error: { message: 'Database error' } 
    },
  },
  updatePoll: {
    success: { 
      data: { id: 'poll-123', question: 'Updated question' }, 
      error: null 
    },
    failure: { 
      data: null, 
      error: { message: 'Update failed' } 
    },
  },
  deletePoll: {
    success: { data: null, error: null },
    failure: { data: null, error: { message: 'Delete failed' } },
  },
  submitVote: {
    success: { data: mockVote, error: null },
    failure: { data: null, error: { message: 'Vote failed' } },
    duplicate: { data: null, error: { code: '23505', message: 'Duplicate vote' } },
  },
}

// Helper to setup Supabase mocks
export function setupSupabaseMock(responses: any) {
  const mockClient = {
    auth: {
      getUser: jest.fn().mockResolvedValue(responses.getUser || mockSupabaseResponses.getUser.success),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue(responses.getPoll || responses.getExistingVote || mockSupabaseResponses.getPoll.success),
        })),
        order: jest.fn().mockResolvedValue({ data: [mockPoll], error: null }),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue(responses.createPoll || responses.submitVote || mockSupabaseResponses.createPoll.success),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue(responses.updatePoll || mockSupabaseResponses.updatePoll.success),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue(responses.deletePoll || mockSupabaseResponses.deletePoll.success),
      })),
    })),
  }

  ;(createClient as jest.Mock).mockResolvedValue(mockClient)
  return mockClient
}

// Helper to create valid poll input
export function createValidPollInput(overrides = {}) {
  return {
    question: 'What is your favorite programming language?',
    options: ['JavaScript', 'TypeScript', 'Python'],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // Tomorrow
    ...overrides,
  }
}

// Helper to create invalid poll input
export function createInvalidPollInput() {
  return {
    question: 'Short', // Too short
    options: ['Only one option'], // Too few options
    expiresAt: 'invalid-date',
  }
}
