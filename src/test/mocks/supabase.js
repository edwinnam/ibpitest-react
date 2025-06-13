import { vi } from 'vitest'

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()
  const mockOrder = vi.fn()
  const mockLimit = vi.fn()

  // Chain methods together
  mockFrom.mockReturnValue({
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
    limit: mockLimit
  })

  mockSelect.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
    limit: mockLimit
  })

  mockEq.mockReturnValue({
    single: mockSingle,
    order: mockOrder,
    limit: mockLimit,
    eq: mockEq
  })

  mockOrder.mockReturnValue({
    limit: mockLimit,
    single: mockSingle
  })

  mockLimit.mockReturnValue({
    single: mockSingle
  })

  const supabase = {
    from: mockFrom,
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }

  return {
    supabase,
    mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
    mockOrder,
    mockLimit
  }
}

// Helper to set up mock responses
export const setupMockResponse = (mockSingle, response) => {
  mockSingle.mockResolvedValueOnce(response)
}

// Helper to set up a series of mock responses
export const setupMockResponses = (mockSingle, responses) => {
  responses.forEach(response => {
    mockSingle.mockResolvedValueOnce(response)
  })
}

// Mock auth responses
export const mockAuthResponses = {
  successfulLogin: {
    data: {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'authenticated'
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token'
      }
    },
    error: null
  },
  failedLogin: {
    data: null,
    error: {
      message: 'Invalid login credentials',
      status: 400
    }
  },
  validSession: {
    data: {
      session: {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      }
    },
    error: null
  },
  noSession: {
    data: { session: null },
    error: null
  }
}