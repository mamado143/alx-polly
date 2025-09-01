import { deletePoll, deletePollAndRedirect } from '@/lib/actions/delete-poll'
import { setupSupabaseMock, mockSupabaseResponses } from '../utils/test-utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Mock Next.js functions
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('deletePoll', () => {
  const pollId = 'poll-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.failure
      })

      const result = await deletePoll(pollId)
      
      expect(result).toEqual({
        ok: false,
        error: 'Unauthorized'
      })
    })
  })

  describe('poll ownership', () => {
    it('should return error when poll does not exist', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.failure
      })

      const result = await deletePoll(pollId)
      
      expect(result).toEqual({
        ok: false,
        error: 'Poll not found'
      })
    })

    it('should return error when user does not own the poll', async () => {
      const otherUserPoll = {
        ...mockSupabaseResponses.getPoll.success.data,
        created_by: 'other-user-456'
      }
      
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: { data: otherUserPoll, error: null }
      })

      const result = await deletePoll(pollId)
      
      expect(result).toEqual({
        ok: false,
        error: 'You can only delete your own polls'
      })
    })
  })

  describe('successful deletion', () => {
    it('should delete poll successfully', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        deletePoll: mockSupabaseResponses.deletePoll.success
      })

      const result = await deletePoll(pollId)
      
      expect(result).toEqual({
        ok: true
      })
      
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
    })

    it('should call delete with correct poll ID', async () => {
      const mockClient = setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        deletePoll: mockSupabaseResponses.deletePoll.success
      })

      await deletePoll(pollId)
      
      // Verify that delete was called with correct poll ID
      expect(mockClient.from().delete().eq).toHaveBeenCalledWith('id', pollId)
    })
  })

  describe('database errors', () => {
    it('should handle database errors gracefully', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        deletePoll: mockSupabaseResponses.deletePoll.failure
      })

      const result = await deletePoll(pollId)
      
      expect(result).toEqual({
        ok: false,
        error: 'Delete failed'
      })
    })

    it('should handle unexpected errors', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        deletePoll: { data: null, error: new Error('Unexpected error') }
      })

      const result = await deletePoll(pollId)
      
      expect(result).toEqual({
        ok: false,
        error: 'Unexpected error'
      })
    })
  })
})

describe('deletePollAndRedirect', () => {
  const pollId = 'poll-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect on successful deletion', async () => {
    setupSupabaseMock({
      getUser: mockSupabaseResponses.getUser.success,
      getPoll: mockSupabaseResponses.getPoll.success,
      deletePoll: mockSupabaseResponses.deletePoll.success
    })

    await deletePollAndRedirect(pollId)
    
    expect(redirect).toHaveBeenCalledWith('/polls?deleted=true')
  })

  it('should not redirect on failed deletion', async () => {
    setupSupabaseMock({
      getUser: mockSupabaseResponses.getUser.failure
    })

    const result = await deletePollAndRedirect(pollId)
    
    expect(redirect).not.toHaveBeenCalled()
    expect(result).toEqual({
      ok: false,
      error: 'Unauthorized'
    })
  })
})
