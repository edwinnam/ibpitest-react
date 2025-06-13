// SMS 발송 서비스
export const smsService = {
  // SMS 설정
  config: {
    proxyUrl: import.meta.env.VITE_SMS_PROXY_URL || 'http://localhost:3001',
    senderNumber: '02-851-1934',
    testMode: import.meta.env.VITE_SMS_TEST_MODE === 'true'
  },

  // SMS 발송
  async sendSMS(recipients) {
    try {
      // 수신자 배열로 변환
      const recipientList = Array.isArray(recipients) ? recipients : [recipients]
      
      // 각 수신자에게 발송
      const results = await Promise.all(
        recipientList.map(async (recipient) => {
          const messageContent = this.generateMessage(recipient)
          
          const payload = {
            key: import.meta.env.VITE_ALIGO_API_KEY,
            userid: import.meta.env.VITE_ALIGO_USER_ID,
            sender: this.config.senderNumber,
            receiver: recipient.phone.replace(/-/g, ''),
            msg: messageContent,
            testmode_yn: this.config.testMode ? 'Y' : 'N'
          }

          try {
            const response = await fetch(`${this.config.proxyUrl}/api/sms/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload)
            })

            const result = await response.json()
            
            if (result.result_code === 1 || result.result_code === '1') {
              return {
                success: true,
                recipient: recipient.name,
                phone: recipient.phone,
                messageId: result.msg_id
              }
            } else {
              throw new Error(result.message || 'SMS 발송 실패')
            }
          } catch (error) {
            console.error(`SMS 발송 실패 (${recipient.name}):`, error)
            return {
              success: false,
              recipient: recipient.name,
              phone: recipient.phone,
              error: error.message
            }
          }
        })
      )

      // 결과 요약
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      return {
        success: failCount === 0,
        results,
        summary: {
          total: results.length,
          success: successCount,
          fail: failCount
        }
      }
    } catch (error) {
      console.error('SMS 서비스 오류:', error)
      throw error
    }
  },

  // 메시지 생성
  generateMessage(recipient) {
    const testSiteUrl = 'https://maumpie.netlify.app/starttest.html'
    
    return `[IBPI 심리검사]
안녕하세요 ${recipient.name}님,
${recipient.institution1}에서 요청하신 IBPI 심리검사 안내입니다.

검사코드: ${recipient.testCode}
검사종류: ${recipient.testType}

아래 링크에서 검사를 진행해주세요:
${testSiteUrl}

* 검사 시 위 검사코드를 입력하셔야 합니다.
* 문의: ${this.config.senderNumber}`
  },

  // 재발송
  async resendSMS(recipients) {
    // 재발송은 일반 발송과 동일하게 처리
    return this.sendSMS(recipients)
  },

  // SMS 발송 상태 확인
  async checkSMSStatus(messageIds) {
    try {
      const response = await fetch(`${this.config.proxyUrl}/api/sms/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: import.meta.env.VITE_ALIGO_API_KEY,
          userid: import.meta.env.VITE_ALIGO_USER_ID,
          msg_ids: messageIds
        })
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('SMS 상태 확인 오류:', error)
      throw error
    }
  }
}