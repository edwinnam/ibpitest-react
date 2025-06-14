/**
 * Simple Test Example
 * 
 * This demonstrates how to run tests for the report functionality
 * without requiring actual database connections
 */

import { reportDataService } from '../../services/reportDataService'
import { mockReportData, mockSupabaseResponses } from '../mocks/reportData'

// Mock the supabase client
const mockFrom = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()

// Setup chain
mockFrom.mockReturnValue({ select: mockSelect })
mockSelect.mockReturnValue({ eq: mockEq })
mockEq.mockReturnValue({ single: mockSingle })

// Mock successful responses
mockSingle
  .mockResolvedValueOnce(mockSupabaseResponses.customerInfo)
  .mockResolvedValueOnce(mockSupabaseResponses.testResult)
  .mockResolvedValueOnce(mockSupabaseResponses.finalScores)
  .mockResolvedValueOnce(mockSupabaseResponses.interpretation)

// Test the service
async function testReportGeneration() {
  console.log('Testing Report Generation...')
  
  try {
    // This would normally call the database
    // But in tests, it uses our mocked data
    const result = await reportDataService.getReportData('test-customer-123', 'test-result-456')
    
    console.log('✓ Report generated successfully')
    console.log('Customer:', result.customerInfo.name)
    console.log('Test Type:', result.testInfo.testType)
    console.log('Main Scales:', Object.keys(result.scores.mainScales))
    console.log('Has interpretation:', !!result.interpretation)
    
    return result
  } catch (error) {
    console.error('✗ Report generation failed:', error)
    throw error
  }
}

// Example of using mock data directly
function testWithMockData() {
  console.log('\nTesting with Mock Data...')
  
  // Access mock data directly
  console.log('Mock Customer:', mockReportData.customerInfo.name)
  console.log('Mock Age:', mockReportData.customerInfo.age)
  console.log('Mock Scores:', {
    co: mockReportData.scores.mainScales.co.percentile,
    cl: mockReportData.scores.mainScales.cl.percentile,
    ob: mockReportData.scores.mainScales.ob.percentile,
    gu: mockReportData.scores.mainScales.gu.percentile,
    sd: mockReportData.scores.mainScales.sd.percentile
  })
  
  console.log('✓ Mock data is accessible')
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Report Test Examples...\n')
  testWithMockData()
}