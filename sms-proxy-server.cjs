const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
const FormData = require('form-data')

const app = express()
const PORT = process.env.PORT || 3001

// CORS 설정
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}))

// JSON 파싱
app.use(express.json())

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// SMS 발송 엔드포인트
app.post('/api/sms/send', async (req, res) => {
  try {
    const {
      key,
      userid,
      sender,
      receiver,
      msg,
      testmode_yn = 'N'
    } = req.body

    console.log('SMS 발송 요청:', {
      userid,
      sender,
      receiver: receiver.substring(0, 7) + '****',
      msgLength: msg.length,
      testmode: testmode_yn
    })

    // FormData 생성
    const formData = new FormData()
    formData.append('key', key)
    formData.append('userid', userid)
    formData.append('sender', sender)
    formData.append('receiver', receiver)
    formData.append('msg', msg)
    formData.append('testmode_yn', testmode_yn)

    // Aligo API 호출
    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    
    console.log('Aligo API 응답:', {
      result_code: result.result_code,
      message: result.message,
      msg_id: result.msg_id
    })

    // 성공 여부 확인
    if (result.result_code == 1) {
      res.json({
        success: true,
        result_code: result.result_code,
        message: result.message || 'SMS 발송 성공',
        msg_id: result.msg_id,
        msg_type: result.msg_type
      })
    } else {
      res.status(400).json({
        success: false,
        result_code: result.result_code,
        message: result.message || 'SMS 발송 실패',
        error: result
      })
    }
  } catch (error) {
    console.error('SMS 발송 오류:', error)
    res.status(500).json({
      success: false,
      message: 'SMS 발송 중 서버 오류가 발생했습니다.',
      error: error.message
    })
  }
})

// SMS 발송 상태 확인 엔드포인트
app.post('/api/sms/status', async (req, res) => {
  try {
    const { key, userid, msg_ids } = req.body

    const formData = new FormData()
    formData.append('key', key)
    formData.append('userid', userid)
    formData.append('mid', msg_ids.join(','))

    const response = await fetch('https://apis.aligo.in/sms_list/', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    res.json(result)
  } catch (error) {
    console.error('SMS 상태 확인 오류:', error)
    res.status(500).json({
      success: false,
      message: 'SMS 상태 확인 중 오류가 발생했습니다.',
      error: error.message
    })
  }
})

// 서버 시작
app.listen(PORT, () => {
  console.log(`SMS 프록시 서버가 포트 ${PORT}에서 실행 중입니다.`)
  console.log(`헬스체크: http://localhost:${PORT}/health`)
})