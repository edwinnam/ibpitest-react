import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import IBPIReport from '../IBPIReport'
import { mockReportData } from '../../../test/mocks/reportData'
import * as reportDataService from '../../../services/reportDataService'

// Mock the report data service
vi.mock('../../../services/reportDataService', () => ({
  reportDataService: {
    getReportData: vi.fn()
  }
}))

// Mock the child components
vi.mock('../ScoreTable', () => ({
  default: ({ mainScales, subScales, showSubScales }) => (
    <div data-testid="score-table">
      Score Table - Main scales: {Object.keys(mainScales).length}
    </div>
  )
}))

vi.mock('../ProfileDiagram', () => ({
  default: ({ scores, size }) => (
    <div data-testid="profile-diagram">
      Profile Diagram - Scores loaded
    </div>
  )
}))

vi.mock('../InterpretationSection', () => ({
  default: ({ interpretation, scores }) => (
    <div data-testid="interpretation-section">
      {interpretation?.summary || 'No interpretation'}
    </div>
  )
}))

describe('IBPIReport', () => {
  const defaultProps = {
    customerId: 'test-customer-123',
    testId: 'test-result-456',
    onDataLoad: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default mock response
    reportDataService.reportDataService.getReportData.mockResolvedValue(mockReportData)
  })

  it('should render loading state initially', () => {
    render(<IBPIReport {...defaultProps} />)
    
    expect(screen.getByText(/보고서를 생성하고 있습니다/)).toBeInTheDocument()
  })

  it('should render report with all sections after loading', async () => {
    render(<IBPIReport {...defaultProps} />)

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/IBPI 대인관계 심리검사 결과보고서/)).toBeInTheDocument()
    })
    
    // Check customer info
    expect(screen.getByText(mockReportData.customerInfo.name)).toBeInTheDocument()
    
    // Check all major sections are rendered
    expect(screen.getByTestId('score-table')).toBeInTheDocument()
    expect(screen.getByTestId('profile-diagram')).toBeInTheDocument()
    expect(screen.getByTestId('interpretation-section')).toBeInTheDocument()
  })

  it('should display customer information correctly', async () => {
    render(<IBPIReport {...defaultProps} />)

    await waitFor(() => {
      // Check personal info
      expect(screen.getByText('이름')).toBeInTheDocument()
      expect(screen.getByText(mockReportData.customerInfo.name)).toBeInTheDocument()
      
      // Check gender display
      expect(screen.getByText('성별')).toBeInTheDocument()
      expect(screen.getByText('남')).toBeInTheDocument() // gender: 'male'
      
      // Check age
      expect(screen.getByText('연령')).toBeInTheDocument()
      expect(screen.getByText(/14세/)).toBeInTheDocument()
    })
  })

  it('should display test information', async () => {
    render(<IBPIReport {...defaultProps} />)

    await waitFor(() => {
      // Check test date
      expect(screen.getByText('검사일')).toBeInTheDocument()
    })
  })

  it('should handle error state', async () => {
    const error = new Error('데이터를 불러올 수 없습니다.')
    reportDataService.reportDataService.getReportData.mockRejectedValue(error)

    render(<IBPIReport {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText(/보고서 생성 중 오류가 발생했습니다/)).toBeInTheDocument()
      expect(screen.getByText(error.message)).toBeInTheDocument()
    })
  })

  it('should call onDataLoad when data is loaded', async () => {
    render(<IBPIReport {...defaultProps} />)

    await waitFor(() => {
      expect(defaultProps.onDataLoad).toHaveBeenCalledWith(mockReportData)
    })
  })

  it('should render institution information when available', async () => {
    render(<IBPIReport {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('소속기관')).toBeInTheDocument()
      expect(screen.getByText(new RegExp(mockReportData.customerInfo.institution1))).toBeInTheDocument()
    })
  })
})