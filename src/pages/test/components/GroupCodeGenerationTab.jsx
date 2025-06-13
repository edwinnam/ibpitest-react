import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../modules/auth/AuthContext'
import { useOrganization } from '../../../modules/organization/OrganizationContext'
import { testCodeService } from '../../../core/services/testCodeService'
import { excelService } from '../../../core/services/excelService'
import './GroupCodeGenerationTab.css'

const GroupCodeGenerationTab = ({ remainingCodes, onRefresh }) => {
  const { user } = useAuth()
  const { getOrgNumber, getOrgName, refreshStats } = useOrganization()
  const fileInputRef = useRef(null)
  
  const [rows, setRows] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [fileSelected, setFileSelected] = useState(false)
  
  // SMS 설정
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [smsSettings, setSmsSettings] = useState({
    sender: '02-851-1934',
    template: 'testCode',
    customMessage: '',
    testMode: true
  })

  // 초기 빈 행 생성
  useEffect(() => {
    addEmptyRows(5)
  }, [])

  const addEmptyRows = (count = 1) => {
    const newRows = Array(count).fill(null).map((_, index) => ({
      id: Date.now() + index + Math.random(),
      testType: '',
      name: '',
      personalId: '',
      institution1: getOrgName() || '',
      institution2: '',
      email: '',
      phone: '',
      standardGroup: ''
    }))
    setRows(prev => [...prev, ...newRows])
  }

  // 검사 종류별 규준집단 옵션
  const getStandardGroupOptions = (testType) => {
    switch (testType) {
      case 'adult':
      case 'IBPI 성인용':
        return [
          { value: '', label: '선택' },
          { value: 'adult_general', label: '성인 일반' },
          { value: 'adult_20s', label: '성인 20대' },
          { value: 'adult_30s', label: '성인 30대' },
          { value: 'adult_40plus', label: '성인 40대이후' }
        ]
      case 'youth':
      case 'IBPI 청소년용':
        return [
          { value: '', label: '선택' },
          { value: 'youth', label: '청소년' }
        ]
      case 'child':
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
        
        return updatedRow
      }
      return row
    }))
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

  // 선택된 행 삭제
  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) return
    
    if (confirm(`선택한 ${selectedRows.length}개 행을 삭제하시겠습니까?`)) {
      setRows(rows.filter(row => !selectedRows.includes(row.id)))
      setSelectedRows([])
      setSelectAll(false)
    }
  }

  // 엑셀 파일 업로드
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const data = await excelService.readExcelFile(file)
      if (data && data.length > 0) {
        // 엑셀 데이터를 행으로 변환
        const excelRows = data.map((item, index) => ({
          id: Date.now() + index + Math.random(),
          testType: item.testType || '',
          name: item.name || '',
          personalId: item.personalId || '',
          institution1: item.institution1 || getOrgName() || '',
          institution2: item.institution2 || '',
          email: item.email || '',
          phone: item.phone || '',
          standardGroup: item.standardGroup || ''
        }))
        
        setRows(excelRows)
        setFileSelected(true)
        
        if (data.length > 500) {
          alert('대량 데이터가 업로드되었습니다. 발송 시 500명씩 나누어 처리됩니다.')
        }
      }
    } catch (error) {
      console.error('엑셀 파일 읽기 오류:', error)
      alert('엑셀 파일을 읽는 중 오류가 발생했습니다.')
    }
    
    // 파일 입력 초기화
    e.target.value = ''
  }

  // 엑셀 템플릿 다운로드
  const handleDownloadTemplate = () => {
    excelService.downloadTemplate()
  }

  // 코드 생성
  const handleCreateCodes = async () => {
    const validRows = rows.filter(row => 
      row.testType && 
      row.name && 
      row.phone && 
      row.standardGroup
    )

    if (validRows.length === 0) {
      alert('필수 정보(검사종류, 이름, 휴대폰번호, 규준집단)를 입력해주세요.')
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

      // 대량 데이터 처리 (500개씩 분할)
      const batchSize = 500
      let createdTotal = 0

      for (let i = 0; i < customersData.length; i += batchSize) {
        const batch = customersData.slice(i, i + batchSize)
        const createdCodes = await testCodeService.createTestCodes(orgNumber, batch)
        createdTotal += createdCodes.length
      }
      
      // 통계 업데이트
      await refreshStats()
      
      alert(`${createdTotal}개의 검사코드가 생성되었습니다.\n\n코드 발송은 [검사코드 발송대기] 탭에서 진행해주세요.`)
      
      // 초기화
      setRows([])
      addEmptyRows(5)
      setSelectedRows([])
      setSelectAll(false)
      setFileSelected(false)
      onRefresh()
    } catch (error) {
      console.error('코드 생성 오류:', error)
      alert(`코드 생성 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  // 유효한 행 수 계산
  const getValidRowCount = () => {
    return rows.filter(row => 
      row.testType && 
      row.name && 
      row.phone && 
      row.standardGroup
    ).length
  }

  return (
    <div className="group-code-generation-tab">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">단체검사 코드 생성</h5>
          <div>
            <span className="badge bg-primary fs-6">
              사용 가능한 코드: <span>{remainingCodes}</span>개
            </span>
          </div>
        </div>
        
        <div className="card-body">
          {/* 안내 메시지 */}
          <div className="alert alert-info">
            <ul className="mb-0">
              <li>엑셀 파일을 업로드하거나 직접 입력하여 검사코드를 생성할 수 있습니다.</li>
              <li>대량 데이터(최대 500명씩 나누어서 발송)를 입력하시려면 '엑셀파일 업로드'를 이용하시기 바랍니다.</li>
            </ul>
          </div>

          {/* 엑셀 업로드 섹션 */}
          <div className="excel-upload-section mb-4">
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".xls,.xlsx,.csv"
              onChange={handleExcelUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="btn btn-outline-success me-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="fas fa-file-excel me-2"></i>
              엑셀 파일 선택
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={handleDownloadTemplate}
            >
              <i className="fas fa-download me-2"></i>
              엑셀 입력양식
            </button>
            {fileSelected && (
              <span className="ms-3 text-success">
                <i className="fas fa-check-circle me-1"></i>
                파일이 선택되었습니다.
              </span>
            )}
          </div>

          {/* 데이터 테이블 */}
          <div className="table-responsive">
            <table className="table table-bordered group-input-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>검사유형<span className="text-danger">*</span></th>
                  <th>이름<span className="text-danger">*</span></th>
                  <th>개인고유번호</th>
                  <th>규준집단<span className="text-danger">*</span></th>
                  <th>소속기관1</th>
                  <th>소속기관2</th>
                  <th>이메일</th>
                  <th>휴대폰번호<span className="text-danger">*</span></th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 데이터 요약 */}
          {rows.length > 0 && (
            <div className="alert alert-info mt-3">
              총 <span className="fw-bold">{getValidRowCount()}</span>명 / 
              IBPI 잔여코드: <span className="fw-bold">{remainingCodes}</span>개
            </div>
          )}

          {/* SMS 설정 섹션 */}
          <div className="card mt-3 sms-settings-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">📱 SMS 발송 설정</h6>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="sms-enable-switch"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="sms-enable-switch">
                  SMS 발송
                </label>
              </div>
            </div>
            
            {smsEnabled && (
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">발신번호</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={smsSettings.sender}
                        onChange={(e) => setSmsSettings({...smsSettings, sender: e.target.value})}
                        placeholder="02-851-1934"
                      />
                      <div className="form-text">등록된 발신번호를 입력하세요</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">메시지 템플릿</label>
                      <select 
                        className="form-select"
                        value={smsSettings.template}
                        onChange={(e) => setSmsSettings({...smsSettings, template: e.target.value})}
                      >
                        <option value="testCode">기본 검사코드 안내</option>
                        <option value="custom">사용자 정의</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {smsSettings.template === 'custom' && (
                  <div className="mb-3">
                    <label className="form-label">사용자 정의 메시지</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={smsSettings.customMessage}
                      onChange={(e) => setSmsSettings({...smsSettings, customMessage: e.target.value})}
                      placeholder="{{name}}님, 검사코드는 {{code}}입니다."
                    />
                    <div className="form-text">
                      {'{{name}}, {{code}}, {{testType}}'} 변수를 사용할 수 있습니다
                    </div>
                  </div>
                )}
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="sms-test-mode"
                        checked={smsSettings.testMode}
                        onChange={(e) => setSmsSettings({...smsSettings, testMode: e.target.checked})}
                      />
                      <label className="form-check-label" htmlFor="sms-test-mode">
                        테스트 모드 (실제 발송 안함)
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6 text-end">
                    <span className="badge bg-info">
                      {smsSettings.testMode ? 'SMS 테스트 모드' : 'SMS 준비됨'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="d-flex justify-content-between mt-4">
            <div>
              <button 
                className="btn btn-secondary me-2"
                onClick={() => addEmptyRows(1)}
              >
                행 추가
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteSelected}
                disabled={selectedRows.length === 0}
              >
                선택 삭제
              </button>
            </div>
            <div>
              <button 
                className="btn btn-secondary me-2"
                onClick={() => {
                  setRows([])
                  addEmptyRows(5)
                  setSelectedRows([])
                  setSelectAll(false)
                  setFileSelected(false)
                }}
              >
                취소
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateCodes}
                disabled={isCreating || getValidRowCount() === 0}
              >
                {isCreating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    생성 중...
                  </>
                ) : (
                  '코드 생성'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GroupCodeGenerationTab