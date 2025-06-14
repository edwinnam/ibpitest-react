import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase module
vi.mock('../../core/services/supabase', () => ({
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
}))

import { reportDataService } from '../../services/reportDataService'
import { mockReportData, mockSupabaseResponses } from '../mocks/reportData'
import { supabase } from '../../core/services/supabase'

describe('Report Generation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Report Generation Flow', () => {
    it('should generate a complete report with all sections', async () => {
      // Mock successful responses for all API calls
      const fromMock = supabase.from()
      
      // Setup mock responses
      fromMock.single
        .mockResolvedValueOnce({ 
          data: { 
            ...mockSupabaseResponses.customerInfo,
            birth_date: '1990-01-01' 
          }, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.testResult, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.finalScores, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.interpretation, 
          error: null 
        })

      const reportData = await reportDataService.getReportData('customer-123', 'test-456')

      // Verify the report structure
      expect(reportData).toHaveProperty('customerInfo')
      expect(reportData).toHaveProperty('testInfo')
      expect(reportData).toHaveProperty('scores')
      expect(reportData).toHaveProperty('interpretation')

      // Verify customer info processing
      expect(reportData.customerInfo).toHaveProperty('name')
      expect(reportData.customerInfo).toHaveProperty('age')
      expect(reportData.customerInfo).toHaveProperty('ageGroup')

      // Verify score calculations
      expect(reportData.scores).toHaveProperty('mainScales')
      expect(reportData.scores).toHaveProperty('subScales')
      
      // Check main scales
      const mainScales = reportData.scores.mainScales
      expect(mainScales).toHaveProperty('co')
      expect(mainScales.co).toHaveProperty('percentile')
      expect(mainScales.co).toHaveProperty('tScore')
      expect(mainScales.co).toHaveProperty('level')

      // Verify interpretation
      expect(reportData.interpretation).toHaveProperty('summary')
    })

    it('should handle partial data gracefully', async () => {
      const fromMock = supabase.from()
      
      // Mock customer info with missing birth_date
      fromMock.single
        .mockResolvedValueOnce({ 
          data: { 
            ...mockSupabaseResponses.customerInfo,
            birth_date: null 
          }, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.testResult, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.finalScores, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: null, 
          error: null 
        })

      const reportData = await reportDataService.getReportData('customer-123', 'test-456')

      // Should still generate report with available data
      expect(reportData).toBeDefined()
      expect(reportData.customerInfo).toBeDefined()
      expect(reportData.scores).toBeDefined()
    })

    it('should handle network errors appropriately', async () => {
      const fromMock = supabase.from()
      fromMock.single.mockRejectedValue(new Error('Network error'))

      await expect(reportDataService.getReportData('customer-123', 'test-456'))
        .rejects.toThrow()
    })
  })

  describe('Performance', () => {
    it('should complete report generation within acceptable time', async () => {
      const fromMock = supabase.from()
      
      // Mock all responses
      fromMock.single
        .mockResolvedValueOnce({ 
          data: { 
            ...mockSupabaseResponses.customerInfo,
            birth_date: '1990-01-01' 
          }, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.testResult, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.finalScores, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.interpretation, 
          error: null 
        })

      const startTime = performance.now()
      await reportDataService.getReportData('customer-123', 'test-456')
      const endTime = performance.now()

      // Report generation should complete within 1 second
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })

  describe('Data Integrity', () => {
    it('should maintain data consistency throughout the report', async () => {
      const fromMock = supabase.from()
      
      const customerId = 'customer-123'
      const testId = 'test-456'
      
      fromMock.single
        .mockResolvedValueOnce({ 
          data: { 
            ...mockSupabaseResponses.customerInfo,
            id: customerId,
            birth_date: '1990-01-01'
          }, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: { 
            ...mockSupabaseResponses.testResult,
            customer_id: customerId,
            id: testId
          }, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.finalScores, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.interpretation, 
          error: null 
        })

      const reportData = await reportDataService.getReportData(customerId, testId)

      // Verify IDs match throughout
      expect(reportData.customerInfo.id).toBe(customerId)
      expect(reportData.testInfo.id).toBe(testId)
      expect(reportData.testInfo.customer_id).toBe(customerId)
    })

    it('should calculate percentiles within valid range', async () => {
      const fromMock = supabase.from()
      
      fromMock.single
        .mockResolvedValueOnce({ 
          data: { 
            ...mockSupabaseResponses.customerInfo,
            birth_date: '1990-01-01' 
          }, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.testResult, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.finalScores, 
          error: null 
        })
        .mockResolvedValueOnce({ 
          data: mockSupabaseResponses.interpretation, 
          error: null 
        })

      const reportData = await reportDataService.getReportData('customer-123', 'test-456')

      // Check all percentiles are within 0-100 range
      Object.values(reportData.scores.mainScales).forEach(scale => {
        expect(scale.percentile).toBeGreaterThanOrEqual(0)
        expect(scale.percentile).toBeLessThanOrEqual(100)
      })

      Object.values(reportData.scores.subScales).forEach(scale => {
        expect(scale.percentile).toBeGreaterThanOrEqual(0)
        expect(scale.percentile).toBeLessThanOrEqual(100)
      })
    })
  })
})