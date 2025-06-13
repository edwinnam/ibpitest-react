import { useState, useEffect } from 'react'
import { supabase } from '../../core/services/supabase'
import './CustomerEditModal.css'

const CustomerEditModal = ({ isOpen, onClose, customerData, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    personal_id: '',
    organization1: '',
    organization2: '',
    email: '',
    phone: '',
    test_date: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (customerData) {
      setFormData({
        name: customerData.name || '',
        gender: customerData.gender || '',
        personal_id: customerData.personal_id || '',
        organization1: customerData.organization1 || '',
        organization2: customerData.organization2 || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        test_date: customerData.test_date ? customerData.test_date.split('T')[0] : ''
      })
    }
  }, [customerData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('customers_info')
        .update({
          name: formData.name,
          gender: formData.gender,
          personal_id: formData.personal_id,
          organization1: formData.organization1,
          organization2: formData.organization2,
          email: formData.email,
          phone: formData.phone,
          test_date: formData.test_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerData.id)

      if (error) throw error

      alert('고객 정보가 수정되었습니다.')
      if (onUpdate) {
        onUpdate({ ...customerData, ...formData })
      }
      onClose()
    } catch (error) {
      console.error('고객 정보 수정 오류:', error)
      alert('고객 정보 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal fade show d-block" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">고객 정보 수정</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">이름</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="gender" className="form-label">성별</label>
                <select
                  className="form-select"
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">선택</option>
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="personal_id" className="form-label">개인고유번호</label>
                <input
                  type="text"
                  className="form-control"
                  id="personal_id"
                  name="personal_id"
                  value={formData.personal_id}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="organization1" className="form-label">소속기관 1</label>
                <input
                  type="text"
                  className="form-control"
                  id="organization1"
                  name="organization1"
                  value={formData.organization1}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="organization2" className="form-label">소속기관 2</label>
                <input
                  type="text"
                  className="form-control"
                  id="organization2"
                  name="organization2"
                  value={formData.organization2}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">이메일</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="phone" className="form-label">스마트폰</label>
                <input
                  type="text"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="test_date" className="form-label">검사일</label>
                <input
                  type="date"
                  className="form-control"
                  id="test_date"
                  name="test_date"
                  value={formData.test_date}
                  onChange={handleChange}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </div>
  )
}

export default CustomerEditModal