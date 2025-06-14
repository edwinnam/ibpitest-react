import { useState } from 'react'
import CustomerInfoForm from './CustomerInfoForm'
import './CodeGenerationTab.css'

const CodeGenerationTab = ({ remainingCodes, onRefresh }) => {
  const [showCustomerForm, setShowCustomerForm] = useState(false)

  const handleCreateClick = () => {
    setShowCustomerForm(true)
  }

  const handleFormClose = () => {
    setShowCustomerForm(false)
    onRefresh() // 코드 수 새로고침
  }

  const handlePurchaseClick = () => {
    // 구매 페이지로 이동
    window.open('/code-purchase', '_blank')
  }

  return (
    <div className="code-generation-tab">
      {!showCustomerForm ? (
        <div className="card card-body">
          <h4 className="text-center mb-3">검사코드 발송</h4>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>검사종류</th>
                  <th>잔여코드</th>
                  <th>검사코드</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>IBPI 성인용, 아동용, 청소년용</td>
                  <td>
                    <span className="remaining-codes">{remainingCodes}</span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm me-2"
                      onClick={handleCreateClick}
                    >
                      생성하기
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={handlePurchaseClick}
                    >
                      구매하기
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <CustomerInfoForm 
          remainingCodes={remainingCodes}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}

export default CodeGenerationTab