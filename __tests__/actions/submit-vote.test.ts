import { submitVote } from '@/lib/actions/submit-vote'
import { setupSupabaseMock, mockSupabaseResponses, mockUser } from '../utils/test-utils'
import { revalidatePath } from 'next/cache'

// Mock Next.js functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('submitVote', () => {
  const pollId = 'poll-123'
  const optionIndex = 1
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('poll validation', () => {
    it('should return error when poll does not exist', async () => {
      setupSupabaseMock({
        getPoll: mockSupabaseResponses.getPoll.failure
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: false,
        error: 'Poll not found'
      })
    })

    it('should return error when poll is expired', async () => {
      const expiredPoll = {
        ...mockSupabaseResponses.getPoll.success.data,
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      }
      
      setupSupabaseMock({
        getPoll: { data: expiredPoll, error: null }
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: false,
        error: 'This poll has expired'
      })
    })

    it('should allow voting on non-expired poll', async () => {
      const futurePoll = {
        ...mockSupabaseResponses.getPoll.success.data,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
      }
      
      setupSupabaseMock({
        getPoll: { data: futurePoll, error: null },
        submitVote: mockSupabaseResponses.submitVote.success
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: true
      })
    })

    it('should allow voting on poll without expiration', async () => {
      const noExpirationPoll = {
        ...mockSupabaseResponses.getPoll.success.data,
        expires_at: null
      }
      
      setupSupabaseMock({
        getPoll: { data: noExpirationPoll, error: null },
        submitVote: mockSupabaseResponses.submitVote.success
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: true
      })
    })
  })

  describe('option validation', () => {
    it('should return error for invalid option index (negative)', async () => {
      setupSupabaseMock({
        getPoll: mockSupabaseResponses.getPoll.success
      })

      const result = await submitVote(pollId, -1)
      
      expect(result).toEqual({
        ok: false,
        error: 'Invalid option selected'
      })
    })

    it('should return error for invalid option index (too high)', async () => {
      setupSupabaseMock({
        getPoll: mockSupabaseResponses.getPoll.success
      })

      const result = await submitVote(pollId, 10) // Poll only has 4 options
      
      expect(result).toEqual({
        ok: false,
        error: 'Invalid option selected'
      })
    })

    it('should accept valid option index', async () => {
      setupSupabaseMock({
        getPoll: mockSupabaseResponses.getPoll.success,
        submitVote: mockSupabaseResponses.submitVote.success
      })

      const result = await submitVote(pollId, 0)
      
      expect(result).toEqual({
        ok: true
      })
    })
  })

  describe('duplicate voting', () => {
    it('should prevent duplicate voting for authenticated users', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        getExistingVote: { data: { id: 'existing-vote' }, error: null }
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: false,
        error: 'You have already voted on this poll'
      })
    })

    it('should allow voting for authenticated users who have not voted', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        getExistingVote: { data: null, error: null },
        submitVote: mockSupabaseResponses.submitVote.success
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: true
      })
    })

    it('should handle unique constraint violation', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        getExistingVote: { data: null, error: null },
        submitVote: mockSupabaseResponses.submitVote.duplicate
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: false,
        error: 'You have already voted on this poll'
      })
    })
  })

  describe('anonymous voting', () => {
    it('should allow anonymous voting', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.failure, // No user
        getPoll: mockSupabaseResponses.getPoll.success,
        submitVote: mockSupabaseResponses.submitVote.success
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: true
      })
    })

    it('should submit vote with null voter_id for anonymous users', async () => {
      const mockClient = setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.failure, // No user
        getPoll: mockSupabaseResponses.getPoll.success,
        submitVote: mockSupabaseResponses.submitVote.success
      })

      await submitVote(pollId, optionIndex)
      
      // Verify that the vote was inserted with null voter_id
      const insertCall = mockClient.from().insert.mock.calls[0][0]
      expect(insertCall.voter_id).toBeNull()
    })
  })

  describe('successful voting', () => {
    it('should submit vote successfully for authenticated user', async () => {
      const mockClient = setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        getExistingVote: { data: null, error: null },
        submitVote: mockSupabaseResponses.submitVote.success
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: true
      })
      
      expect(revalidatePath).toHaveBeenCalledWith(`/polls/${pollId}`)
      expect(revalidatePath).toHaveBeenCalledWith(`/polls/${pollId}/results`)
      
      // Verify that the vote was inserted with correct data
      const insertCall = mockClient.from().insert.mock.calls[0][0]
      expect(insertCall).toEqual({
        poll_id: pollId,
        option_index: optionIndex,
        voter_id: mockUser.id
      })
    })

    it('should submit vote successfully for anonymous user', async () => {
      const mockClient = setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.failure,
        getPoll: mockSupabaseResponses.getPoll.success,
        submitVote: mockSupabaseResponses.submitVote.success
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: true
      })
      
      // Verify that the vote was inserted with correct data
      const insertCall = mockClient.from().insert.mock.calls[0][0]
      expect(insertCall).toEqual({
        poll_id: pollId,
        option_index: optionIndex,
        voter_id: null
      })
    })
  })

  describe('database errors', () => {
    it('should handle database errors gracefully', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        getExistingVote: { data: null, error: null },
        submitVote: mockSupabaseResponses.submitVote.failure
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: false,
        error: 'Vote failed'
      })
    })

    it('should handle unexpected errors', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        getExistingVote: { data: null, error: null },
        submitVote: { data: null, error: new Error('Unexpected error') }
      })

      const result = await submitVote(pollId, optionIndex)
      
      expect(result).toEqual({
        ok: false,
        error: 'Unexpected error'
      })
    })
  })
})
