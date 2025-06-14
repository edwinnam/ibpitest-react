import { useState, useEffect } from 'react'
import { useAuth } from '../../../modules/auth/AuthContext'
import { useOrganization } from '../../../modules/organization/OrganizationContext'
import { testCodeService } from '../../../core/services/testCodeService'
import './CustomerInfoForm.css'

const CustomerInfoForm = ({ remainingCodes, onClose }) => {
  const { user } = useAuth()
  const { getOrgNumber, getOrgName, refreshStats } = useOrganization()
  const [rows, setRows] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // 초기 행 생성
  useEffect(() => {
    const initialRows = Array(3).fill(null).map((_, index) => ({
      id: Date.now() + index,
      testType: '',
      name: '',
      personalId: '',
      institution1: getOrgName() || '',
      institution2: '',
      email: '',
      phone: '',
      standardGroup: ''
    }))
    setRows(initialRows)
  }, [getOrgName])

  // 검사 종류별 규준집단 옵션
  const getStandardGroupOptions = (testType) => {
    switch (testType) {
      case 'IBPI 성인용':
        return [
          { value: '', label: '선택' },
          { value: 'adult_general', label: '성인 일반' },
          { value: 'adult_20s', label: '성인 20대' },
          { value: 'adult_30s', label: '성인 30대' },
          { value: 'adult_40plus', label: '성인 40대이후' }
        ]
      case 'IBPI 청소년용':
        return [
          { value: '', label: '선택' },
          { value: 'youth', label: '청소년' }
        ]
      case 'IBPI 어린이용':
        return [
          { value: '', label: '선택' },
          { value: 'child', label: '어린이' },
          { value: 'child_3to5', label: '어린이 3~5세' },
          { value: 'child_6to8', label: '어린이 6~8세' },
          { value: 'child_9to12', label: '어린이 9~12세' }
        ]
      default:
        return [{ value: '', label: '선택' }]
    }
  }

  // 행 데이터 변경
  const handleRowChange = (rowId, field, value) => {
    setRows(prev => prev.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [field]: value }
        
        // 검사종류 변경 시 규준집단 초기화
        if (field === 'testType') {
          updatedRow.standardGroup = ''
        }
        
        // 필수 필드 체크
        const isComplete = updatedRow.testType && 
                          updatedRow.name && 
                          updatedRow.phone && 
                          updatedRow.standardGroup
        
        // 체크박스 상태 업데이트
        if (isComplete && !selectedRows.includes(rowId)) {
          setSelectedRows([...selectedRows, rowId])
        } else if (!isComplete && selectedRows.includes(rowId)) {
          setSelectedRows(selectedRows.filter(id => id !== rowId))
        }
        
        return updatedRow
      }
      return row
    }))
  }

  // 행 추가
  const handleAddRow = () => {
    const newRow = {
      id: Date.now(),
      testType: '',
      name: '',
      personalId: '',
      institution1: getOrgName() || '',
      institution2: '',
      email: '',
      phone: '',
      standardGroup: ''
    }
    setRows([...rows, newRow])
  }

  // 선택된 행 삭제
  const handleDeleteSelected = () => {
    setRows(rows.filter(row => !selectedRows.includes(row.id)))
    setSelectedRows([])
    setSelectAll(false)
  }

  // 전체 선택/해제
  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedRows(rows.map(row => row.id))
    } else {
      setSelectedRows([])
    }
  }

  // 행 선택
  const handleRowSelect = (rowId, checked) => {
    if (checked) {
      setSelectedRows([...selectedRows, rowId])
    } else {
      setSelectedRows(selectedRows.filter(id => id !== rowId))
      setSelectAll(false)
    }
  }

  // 코드 생성
  const handleCreateCodes = async () => {
    const validRows = rows.filter(row => 
      selectedRows.includes(row.id) &&
      row.testType && 
      row.name && 
      row.phone && 
      row.standardGroup
    )

    if (validRows.length === 0) {
      alert('검사 정보를 입력해주세요.')
      return
    }

    if (validRows.length > remainingCodes) {
      alert(`사용 가능한 코드가 부족합니다.\n필요: ${validRows.length}개, 잔여: ${remainingCodes}개`)
      return
    }

    setIsCreating(true)
    
    try {
      const orgNumber = getOrgNumber()
      if (!orgNumber) {
        throw new Error('기관 정보를 찾을 수 없습니다.')
      }

      // 코드 생성 데이터 준비
      const customersData = validRows.map(row => ({
        testType: row.testType,
        name: row.name,
        phone: row.phone,
        email: row.email,
        standardGroup: row.standardGroup,
        personalId: row.personalId,
        institution1: row.institution1,
        institution2: row.institution2
      }))

      // 코드 생성 서비스 호출
      const createdCodes = await testCodeService.createTestCodes(orgNumber, customersData)
      
      // 통계 업데이트
      await refreshStats()
      
      alert(`${createdCodes.length}개의 검사코드가 생성되었습니다.\n\n코드 발송은 [검사코드 발송대기] 탭에서 진행해주세요.`)
      onClose()
    } catch (error) {
      console.error('코드 생성 오류:', error)
      alert(`코드 생성 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="customer-info-form card card-body">
      <h4 className="text-center mb-3">수검자 정보 입력</h4>
      
      <ul className="info-list mb-4">
        <li>검사 기관이 입력한 수검자의 이름과 인증코드가 일치해야 검사 실시가 가능합니다.</li>
        <li>인증코드 발송을 위해 이메일과 휴대폰 번호 중 하나 또는 둘 다 선택하여 보내실 수 있습니다.</li>
      </ul>

      <div className="form-controls mb-3">
        <button className="btn btn-primary btn-sm me-2" onClick={handleAddRow}>
          목록 추가
        </button>
        <button 
          className="btn btn-danger btn-sm"
          onClick={handleDeleteSelected}
          disabled={selectedRows.length === 0}
        >
          선택 삭제
        </button>
      </div>

      <div className="summary-info mb-3">
        총 <span className="text-primary fw-bold">{selectedRows.length}</span>명 / 
        IBPI 잔여코드: <span className="text-info fw-bold">{remainingCodes}</span>개
      </div>

      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th>검사종류<span className="required">*</span></th>
              <th>이름<span className="required">*</span></th>
              <th>개인고유번호</th>
              <th>소속기관1</th>
              <th>소속기관2</th>
              <th>이메일</th>
              <th>휴대폰 번호<span className="required">*</span></th>
              <th>규준집단<span className="required">*</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td>
                  <input 
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                  />
                </td>
                <td>
                  <select 
                    className="form-select form-select-sm"
                    value={row.testType}
                    onChange={(e) => handleRowChange(row.id, 'testType', e.target.value)}
                  >
                    <option value="">선택</option>
                    <option value="IBPI 성인용">IBPI 성인용</option>
                    <option value="IBPI 청소년용">IBPI 청소년용</option>
                    <option value="IBPI 어린이용">IBPI 어린이용</option>
                  </select>
                </td>
                <td>
                  <input 
                    type="text"
                    className="form-control form-control-sm"
                    value={row.name}
                    onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input 
                    type="text"
                    className="form-control form-control-sm"
                    value={row.personalId}
                    onChange={(e) => handleRowChange(row.id, 'personalId', e.target.value)}
                  />
                </td>
                <td>
                  <input 
                    type="text"
                    className="form-control form-control-sm"
                    value={row.institution1}
                    readOnly
                  />
                </td>
                <td>
                  <input 
                    type="text"
                    className="form-control form-control-sm"
                    value={row.institution2}
                    onChange={(e) => handleRowChange(row.id, 'institution2', e.target.value)}
                  />
                </td>
                <td>
                  <input 
                    type="email"
                    className="form-control form-control-sm"
                    value={row.email}
                    onChange={(e) => handleRowChange(row.id, 'email', e.target.value)}
                  />
                </td>
                <td>
                  <input 
                    type="tel"
                    className="form-control form-control-sm"
                    value={row.phone}
                    onChange={(e) => handleRowChange(row.id, 'phone', e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </td>
                <td>
                  <select 
                    className="form-select form-select-sm"
                    value={row.standardGroup}
                    onChange={(e) => handleRowChange(row.id, 'standardGroup', e.target.value)}
                    disabled={!row.testType}
                  >
                    {getStandardGroupOptions(row.testType).map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-actions mt-4">
        <button 
          className="btn btn-secondary me-3"
          onClick={onClose}
        >
          취소
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleCreateCodes}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <i className="fas fa-spinner fa-spin me-2"></i>
              생성 중...
            </>
          ) : (
            '생성하기'
          )}
        </button>
      </div>
    </div>
  )
}

export default CustomerInfoForm