import { updatePoll, updatePollAndRedirect } from '@/lib/actions/update-poll'
import { setupSupabaseMock, createValidPollInput, mockSupabaseResponses } from '../utils/test-utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Mock Next.js functions
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('updatePoll', () => {
  const pollId = 'poll-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validation', () => {
    it('should return error for invalid input', async () => {
      const invalidInput = { question: 'Short', options: ['Only one'] }
      const result = await updatePoll(pollId, invalidInput)
      
      expect(result).toEqual({
        ok: false,
        error: 'Question must be at least 10 characters'
      })
    })

    it('should return error for question too short', async () => {
      const input = createValidPollInput({ question: 'Short' })
      const result = await updatePoll(pollId, input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Question must be at least 10 characters'
      })
    })

    it('should return error for question too long', async () => {
      const longQuestion = 'a'.repeat(281)
      const input = createValidPollInput({ question: longQuestion })
      const result = await updatePoll(pollId, input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Question must be less than 280 characters'
      })
    })

    it('should return error for too few options', async () => {
      const input = createValidPollInput({ options: ['Only one option'] })
      const result = await updatePoll(pollId, input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Must have at least 2 options'
      })
    })

    it('should return error for too many options', async () => {
      const manyOptions = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`)
      const input = createValidPollInput({ options: manyOptions })
      const result = await updatePoll(pollId, input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Cannot have more than 10 options'
      })
    })

    it('should return error for duplicate options', async () => {
      const input = createValidPollInput({ options: ['JavaScript', 'javascript', 'TypeScript'] })
      const result = await updatePoll(pollId, input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Options must be unique (case-insensitive)'
      })
    })
  })

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.failure
      })

      const input = createValidPollInput()
      const result = await updatePoll(pollId, input)
      
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

      const input = createValidPollInput()
      const result = await updatePoll(pollId, input)
      
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

      const input = createValidPollInput()
      const result = await updatePoll(pollId, input)
      
      expect(result).toEqual({
        ok: false,
        error: 'You can only edit your own polls'
      })
    })
  })

  describe('successful update', () => {
    it('should update poll successfully', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        updatePoll: mockSupabaseResponses.updatePoll.success
      })

      const input = createValidPollInput()
      const result = await updatePoll(pollId, input)
      
      expect(result).toEqual({
        ok: true,
        data: {
          id: 'poll-123',
          question: 'Updated question'
        }
      })
      
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(revalidatePath).toHaveBeenCalledWith(`/polls/${pollId}`)
    })

    it('should update poll without expiration date', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        updatePoll: mockSupabaseResponses.updatePoll.success
      })

      const input = createValidPollInput({ expiresAt: undefined })
      const result = await updatePoll(pollId, input)
      
      expect(result).toEqual({
        ok: true,
        data: {
          id: 'poll-123',
          question: 'Updated question'
        }
      })
    })

    it('should trim and deduplicate options', async () => {
      const mockClient = setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        updatePoll: mockSupabaseResponses.updatePoll.success
      })

      const input = createValidPollInput({ 
        options: ['  JavaScript  ', 'javascript', '  TypeScript  '] 
      })
      
      await updatePoll(pollId, input)
      
      // Verify that the update was called with cleaned options
      const updateCall = mockClient.from().update.mock.calls[0][0]
      expect(updateCall.options).toEqual(['JavaScript', 'TypeScript'])
    })

    it('should trim question', async () => {
      const mockClient = setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        updatePoll: mockSupabaseResponses.updatePoll.success
      })

      const input = createValidPollInput({ 
        question: '  What is your favorite programming language?  ' 
      })
      
      await updatePoll(pollId, input)
      
      // Verify that the update was called with trimmed question
      const updateCall = mockClient.from().update.mock.calls[0][0]
      expect(updateCall.question).toBe('What is your favorite programming language?')
    })
  })

  describe('database errors', () => {
    it('should handle database errors gracefully', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        updatePoll: mockSupabaseResponses.updatePoll.failure
      })

      const input = createValidPollInput()
      const result = await updatePoll(pollId, input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Update failed'
      })
    })

    it('should handle unexpected errors', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        getPoll: mockSupabaseResponses.getPoll.success,
        updatePoll: { data: null, error: new Error('Unexpected error') }
      })

      const input = createValidPollInput()
      const result = await updatePoll(pollId, input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Unexpected error'
      })
    })
  })
})

describe('updatePollAndRedirect', () => {
  const pollId = 'poll-123'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect on successful update', async () => {
    setupSupabaseMock({
      getUser: mockSupabaseResponses.getUser.success,
      getPoll: mockSupabaseResponses.getPoll.success,
      updatePoll: mockSupabaseResponses.updatePoll.success
    })

    const input = createValidPollInput()
    await updatePollAndRedirect(pollId, input)
    
    expect(redirect).toHaveBeenCalledWith('/polls?updated=true')
  })

  it('should not redirect on failed update', async () => {
    setupSupabaseMock({
      getUser: mockSupabaseResponses.getUser.failure
    })

    const input = createValidPollInput()
    const result = await updatePollAndRedirect(pollId, input)
    
    expect(redirect).not.toHaveBeenCalled()
    expect(result).toEqual({
      ok: false,
      error: 'Unauthorized'
    })
  })
})
