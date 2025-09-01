import { createPoll, createPollAndRedirect } from '@/lib/actions/create-poll'
import { setupSupabaseMock, createValidPollInput, createInvalidPollInput, mockSupabaseResponses } from '../utils/test-utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Mock Next.js functions
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('createPoll', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validation', () => {
    it('should return error for invalid input', async () => {
      const invalidInput = createInvalidPollInput()
      const result = await createPoll(invalidInput)
      
      expect(result).toEqual({
        ok: false,
        error: 'Question must be at least 10 characters'
      })
    })

    it('should return error for question too short', async () => {
      const input = createValidPollInput({ question: 'Short' })
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Question must be at least 10 characters'
      })
    })

    it('should return error for question too long', async () => {
      const longQuestion = 'a'.repeat(281)
      const input = createValidPollInput({ question: longQuestion })
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Question must be less than 280 characters'
      })
    })

    it('should return error for too few options', async () => {
      const input = createValidPollInput({ options: ['Only one option'] })
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Must have at least 2 options'
      })
    })

    it('should return error for too many options', async () => {
      const manyOptions = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`)
      const input = createValidPollInput({ options: manyOptions })
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Cannot have more than 10 options'
      })
    })

    it('should return error for duplicate options', async () => {
      const input = createValidPollInput({ options: ['JavaScript', 'javascript', 'TypeScript'] })
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Options must be unique (case-insensitive)'
      })
    })

    it('should return error for empty options', async () => {
      const input = createValidPollInput({ options: ['JavaScript', '', 'TypeScript'] })
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Option cannot be empty'
      })
    })

    it('should return error for options too long', async () => {
      const longOption = 'a'.repeat(81)
      const input = createValidPollInput({ options: ['JavaScript', longOption] })
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Option must be less than 80 characters'
      })
    })
  })

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.failure
      })

      const input = createValidPollInput()
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Unauthorized'
      })
    })
  })

  describe('successful creation', () => {
    it('should create poll successfully with valid input', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        createPoll: mockSupabaseResponses.createPoll.success
      })

      const input = createValidPollInput()
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: true,
        data: {
          id: 'poll-123',
          question: 'What is your favorite programming language?'
        }
      })
      
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
    })

    it('should create poll without expiration date', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        createPoll: mockSupabaseResponses.createPoll.success
      })

      const input = createValidPollInput({ expiresAt: undefined })
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: true,
        data: {
          id: 'poll-123',
          question: 'What is your favorite programming language?'
        }
      })
    })

    it('should trim and deduplicate options', async () => {
      const mockClient = setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        createPoll: mockSupabaseResponses.createPoll.success
      })

      const input = createValidPollInput({ 
        options: ['  JavaScript  ', 'javascript', '  TypeScript  '] 
      })
      
      await createPoll(input)
      
      // Verify that the insert was called with cleaned options
      const insertCall = mockClient.from().insert.mock.calls[0][0]
      expect(insertCall.options).toEqual(['JavaScript', 'TypeScript'])
    })

    it('should trim question', async () => {
      const mockClient = setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        createPoll: mockSupabaseResponses.createPoll.success
      })

      const input = createValidPollInput({ 
        question: '  What is your favorite programming language?  ' 
      })
      
      await createPoll(input)
      
      // Verify that the insert was called with trimmed question
      const insertCall = mockClient.from().insert.mock.calls[0][0]
      expect(insertCall.question).toBe('What is your favorite programming language?')
    })
  })

  describe('database errors', () => {
    it('should handle database errors gracefully', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        createPoll: mockSupabaseResponses.createPoll.failure
      })

      const input = createValidPollInput()
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Database error'
      })
    })

    it('should handle unexpected errors', async () => {
      setupSupabaseMock({
        getUser: mockSupabaseResponses.getUser.success,
        createPoll: { data: null, error: new Error('Unexpected error') }
      })

      const input = createValidPollInput()
      const result = await createPoll(input)
      
      expect(result).toEqual({
        ok: false,
        error: 'Unexpected error'
      })
    })
  })
})

describe('createPollAndRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect on successful creation', async () => {
    setupSupabaseMock({
      getUser: mockSupabaseResponses.getUser.success,
      createPoll: mockSupabaseResponses.createPoll.success
    })

    const input = createValidPollInput()
    await createPollAndRedirect(input)
    
    expect(redirect).toHaveBeenCalledWith('/polls?created=true')
  })

  it('should not redirect on failed creation', async () => {
    setupSupabaseMock({
      getUser: mockSupabaseResponses.getUser.failure
    })

    const input = createValidPollInput()
    const result = await createPollAndRedirect(input)
    
    expect(redirect).not.toHaveBeenCalled()
    expect(result).toEqual({
      ok: false,
      error: 'Unauthorized'
    })
  })
})
