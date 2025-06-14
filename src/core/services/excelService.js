import * as XLSX from 'xlsx'

export const excelService = {
  // 엑셀 파일 읽기
  async readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // 첫 번째 시트 가져오기
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          
          // JSON으로 변환
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
            header: 1,
            defval: '' 
          })
          
          if (jsonData.length === 0) {
            reject(new Error('엑셀 파일에 데이터가 없습니다.'))
            return
          }
          
          // 헤더 매핑
          const headers = jsonData[0]
          const mappedData = []
          
          // 헤더 인덱스 찾기
          const headerMap = this.mapHeaders(headers)
          
          // 데이터 행 처리 (헤더 제외)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i]
            
            // 빈 행 스킵
            if (!row || row.every(cell => !cell)) continue
            
            const mappedRow = {
              testType: this.normalizeTestType(row[headerMap.testType] || ''),
              name: row[headerMap.name] || '',
              personalId: row[headerMap.personalId] || '',
              standardGroup: this.normalizeStandardGroup(row[headerMap.standardGroup] || ''),
              institution1: row[headerMap.institution1] || '',
              institution2: row[headerMap.institution2] || '',
              email: row[headerMap.email] || '',
              phone: this.formatPhoneNumber(row[headerMap.phone] || '')
            }
            
            // 필수 필드 체크
            if (mappedRow.name && mappedRow.phone) {
              mappedData.push(mappedRow)
            }
          }
          
          resolve(mappedData)
        } catch (error) {
          reject(new Error('엑셀 파일 처리 중 오류가 발생했습니다: ' + error.message))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('파일을 읽을 수 없습니다.'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  },

  // 헤더 매핑
  mapHeaders(headers) {
    const headerMap = {
      testType: -1,
      name: -1,
      personalId: -1,
      standardGroup: -1,
      institution1: -1,
      institution2: -1,
      email: -1,
      phone: -1
    }
    
    headers.forEach((header, index) => {
      const normalized = header.toString().toLowerCase().replace(/\s/g, '')
      
      // 검사유형
      if (['검사유형', '검사종류', 'testtype', '검사타입', 'test-type'].includes(normalized)) {
        headerMap.testType = index
      }
      // 이름
      else if (['이름', 'name', '성명', '고객명'].includes(normalized)) {
        headerMap.name = index
      }
      // 개인고유번호
      else if (['개인고유번호', 'personalid', '고유번호', '개인번호'].includes(normalized)) {
        headerMap.personalId = index
      }
      // 규준집단
      else if (['규준집단', '규준', '기준집단', '표준집단', 'standardgroup'].includes(normalized)) {
        headerMap.standardGroup = index
      }
      // 소속기관1
      else if (['소속기관1', '소속기관', '기관', '회사', '학교', 'institution1'].includes(normalized)) {
        headerMap.institution1 = index
      }
      // 소속기관2
      else if (['소속기관2', 'institution2'].includes(normalized)) {
        headerMap.institution2 = index
      }
      // 이메일
      else if (['이메일', 'email', '메일', 'e-mail'].includes(normalized)) {
        headerMap.email = index
      }
      // 휴대폰번호
      else if (['휴대폰번호', '휴대폰', '전화번호', '스마트폰번호', 'phone', '연락처', '핸드폰'].includes(normalized)) {
        headerMap.phone = index
      }
    })
    
    return headerMap
  },

  // 검사유형 정규화
  normalizeTestType(testType) {
    const normalized = testType.toString().toLowerCase().replace(/\s/g, '')
    
    if (normalized.includes('성인') || normalized.includes('adult')) {
      return 'IBPI 성인용'
    } else if (normalized.includes('청소년') || normalized.includes('youth')) {
      return 'IBPI 청소년용'
    } else if (normalized.includes('어린이') || normalized.includes('아동') || normalized.includes('child')) {
      return 'IBPI 어린이용'
    }
    
    return testType
  },

  // 규준집단 정규화
  normalizeStandardGroup(standardGroup) {
    const normalized = standardGroup.toString().toLowerCase().replace(/\s/g, '')
    
    // 성인 규준집단
    if (normalized.includes('성인일반') || normalized === 'adult_general') {
      return 'adult_general'
    } else if (normalized.includes('성인20대') || normalized === 'adult_20s') {
      return 'adult_20s'
    } else if (normalized.includes('성인30대') || normalized === 'adult_30s') {
      return 'adult_30s'
    } else if (normalized.includes('성인40대') || normalized === 'adult_40plus') {
      return 'adult_40plus'
    }
    // 청소년 규준집단
    else if (normalized === '청소년' || normalized === 'youth') {
      return 'youth'
    }
    // 어린이 규준집단
    else if (normalized === '어린이' || normalized === 'child') {
      return 'child'
    } else if (normalized.includes('3~5세') || normalized === 'child_3to5') {
      return 'child_3to5'
    } else if (normalized.includes('6~8세') || normalized === 'child_6to8') {
      return 'child_6to8'
    } else if (normalized.includes('9~12세') || normalized === 'child_9to12') {
      return 'child_9to12'
    }
    
    return ''
  },

  // 전화번호 포맷팅
  formatPhoneNumber(phone) {
    // 숫자만 추출
    const numbers = phone.toString().replace(/[^0-9]/g, '')
    
    // 11자리인 경우 하이픈 추가
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
    }
    // 10자리인 경우
    else if (numbers.length === 10) {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    }
    
    return phone
  },

  // 엑셀 템플릿 다운로드
  downloadTemplate() {
    // 템플릿 데이터
    const templateData = [
      ['검사유형', '이름', '개인고유번호', '규준집단', '소속기관1', '소속기관2', '이메일', '휴대폰번호'],
      ['IBPI 성인용', '홍길동', '123456', '성인 일반', '○○회사', '영업팀', 'hong@example.com', '010-1234-5678'],
      ['IBPI 청소년용', '김학생', '234567', '청소년', '○○고등학교', '2학년 3반', '', '010-2345-6789'],
      ['IBPI 어린이용', '이아동', '345678', '어린이 6~8세', '○○초등학교', '1학년 2반', '', '010-3456-7890']
    ]
    
    // 워크시트 생성
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    
    // 열 너비 설정
    ws['!cols'] = [
      { wch: 15 }, // 검사유형
      { wch: 12 }, // 이름
      { wch: 15 }, // 개인고유번호
      { wch: 15 }, // 규준집단
      { wch: 20 }, // 소속기관1
      { wch: 20 }, // 소속기관2
      { wch: 25 }, // 이메일
      { wch: 15 }  // 휴대폰번호
    ]
    
    // 워크북 생성
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '단체검사 입력양식')
    
    // 파일 저장
    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `IBPI_단체검사_입력양식_${today}.xlsx`)
  }
}