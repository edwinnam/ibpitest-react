import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase module
vi.mock('../../core/services/supabase', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis()
      }))
    }
  }
})

// Import after mocking
import { reportDataService } from '../reportDataService'
import { 
  mockReportData,
  mockSupabaseResponses,
  mockErrorResponses,
  mockCustomerInfo,
  mockFinalScores,
  mockScoresWithStats
} from '../../test/mocks/reportData'
import { supabase } from '../../core/services/supabase'

describe('reportDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCustomerInfo', () => {
    it('should fetch customer information successfully', async () => {
      const mockData = mockCustomerInfo
      const fromMock = supabase.from()
      fromMock.single.mockResolvedValue({ data: mockData, error: null })

      const result = await reportDataService.getCustomerInfo('customer-123')

      expect(supabase.from).toHaveBeenCalledWith('customer_info')
      expect(fromMock.select).toHaveBeenCalledWith(`
        *,
        test_codes!inner(
          test_code,
          test_type,
          org_number,
          biz_partner_info!inner(
            company_name,
            branch_name
          )
        )
      `)
      expect(fromMock.eq).toHaveBeenCalledWith('id', 'customer-123')
      expect(result).toEqual(mockData)
    })

    it('should handle errors when fetching customer info', async () => {
      const fromMock = supabase.from()
      fromMock.single.mockResolvedValue({ data: null, error: new Error('Database error') })

      await expect(reportDataService.getCustomerInfo('customer-123'))
        .rejects.toThrow('고객 정보 조회 실패')
    })
  })

  describe('getTestResult', () => {
    it('should fetch test result successfully', async () => {
      const mockData = mockSupabaseResponses.testResult
      const fromMock = supabase.from()
      fromMock.single.mockResolvedValue({ data: mockData, error: null })

      const result = await reportDataService.getTestResult('customer-123', 'test-456')

      expect(supabase.from).toHaveBeenCalledWith('test_results')
      expect(fromMock.select).toHaveBeenCalledWith('*')
      expect(fromMock.eq).toHaveBeenCalledWith('customer_id', 'customer-123')
      expect(fromMock.eq).toHaveBeenCalledWith('id', 'test-456')
      expect(result).toEqual(mockData)
    })
  })

  describe('getFinalScores', () => {
    it('should fetch and process final scores successfully', async () => {
      const mockData = mockFinalScores
      const fromMock = supabase.from()
      fromMock.single.mockResolvedValue({ data: mockData, error: null })

      const result = await reportDataService.getFinalScores('customer-123', 'test-456')

      expect(supabase.from).toHaveBeenCalledWith('test_final_scores')
      expect(result).toBeDefined()
      expect(result.raw_scores).toBeDefined()
      expect(result.co_original).toBe(mockData.co_original)
    })
  })

  describe('calculatePercentile', () => {
    it('should calculate percentile correctly', () => {
      const percentile = reportDataService.calculatePercentile(50, 'adult', 'male', 'co')
      expect(percentile).toBeGreaterThanOrEqual(0)
      expect(percentile).toBeLessThanOrEqual(100)
    })

    it('should handle unknown scale gracefully', () => {
      const percentile = reportDataService.calculatePercentile(50, 'adult', 'male', 'unknown')
      expect(percentile).toBe(50)
    })
  })

  describe('getGroupComparison', () => {
    it('should fetch group comparison data', async () => {
      const mockData = mockSupabaseResponses.groupComparison
      const fromMock = supabase.from()
      fromMock.single.mockResolvedValue({ data: mockData, error: null })

      const result = await reportDataService.getGroupComparison('org-123', 'test-type')

      expect(supabase.from).toHaveBeenCalledWith('group_statistics')
      expect(result).toEqual(mockData)
    })
  })

  describe('calculateScoreStatistics', () => {
    it('should calculate all statistics correctly', () => {
      const stats = reportDataService.calculateScoreStatistics(
        mockScoresWithStats,
        'adult',
        'male'
      )

      expect(stats).toBeDefined()
      expect(stats.mainScales).toBeDefined()
      expect(stats.mainScales.co).toHaveProperty('percentile')
      expect(stats.mainScales.co).toHaveProperty('tScore')
      expect(stats.mainScales.co).toHaveProperty('level')
      expect(stats.subScales).toBeDefined()
    })
  })

  describe('getReportData', () => {
    it('should fetch complete report data', async () => {
      // Mock all required API calls
      const fromMock = supabase.from()
      
      // Mock customer info
      fromMock.single
        .mockResolvedValueOnce({ data: mockCustomerInfo, error: null })
        // Mock test result
        .mockResolvedValueOnce({ data: mockSupabaseResponses.testResult, error: null })
        // Mock final scores
        .mockResolvedValueOnce({ data: mockFinalScores, error: null })
        // Mock interpretation
        .mockResolvedValueOnce({ data: mockSupabaseResponses.interpretation, error: null })

      const result = await reportDataService.getReportData('customer-123', 'test-456')

      expect(result).toHaveProperty('customerInfo')
      expect(result).toHaveProperty('testInfo')
      expect(result).toHaveProperty('scores')
      expect(result).toHaveProperty('interpretation')
    })

    it('should handle errors gracefully', async () => {
      const fromMock = supabase.from()
      fromMock.single.mockResolvedValue({ data: null, error: new Error('Network error') })

      await expect(reportDataService.getReportData('customer-123', 'test-456'))
        .rejects.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values in scores', async () => {
      const mockScoresWithNulls = {
        ...mockFinalScores,
        co_original: null,
        cl_original: null
      }
      const fromMock = supabase.from()
      fromMock.single.mockResolvedValue({ data: mockScoresWithNulls, error: null })

      const result = await reportDataService.getFinalScores('customer-123', 'test-456')
      expect(result.co_original).toBeNull()
    })

    it('should handle missing age group gracefully', () => {
      const percentile = reportDataService.calculatePercentile(50, null, 'male', 'co')
      expect(percentile).toBe(50)
    })
  })
})