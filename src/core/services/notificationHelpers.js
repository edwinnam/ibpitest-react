import notificationService from './notificationService';

/**
 * Helper functions to create notifications for various system events
 */

/**
 * Create notification when test code is generated
 */
export const notifyCodeGenerated = async (userId, orgId, codeData) => {
  return await notificationService.createNotification({
    user_id: userId,
    organization_id: orgId,
    type: 'code_generated',
    title: '검사 코드 생성 완료',
    message: `${codeData.count}개의 ${codeData.testType} 검사 코드가 생성되었습니다.`,
    data: {
      url: '/test-management',
      codes: codeData.codes,
      testType: codeData.testType
    }
  });
};

/**
 * Create notification when test code is sent via SMS
 */
export const notifyCodeSent = async (userId, orgId, sendData) => {
  return await notificationService.createNotification({
    user_id: userId,
    organization_id: orgId,
    type: 'code_sent',
    title: '검사 코드 발송 완료',
    message: `${sendData.customerName}님께 검사 코드가 발송되었습니다.`,
    data: {
      customerName: sendData.customerName,
      phone: sendData.phone,
      code: sendData.code
    }
  });
};

/**
 * Create notification when customer completes test
 */
export const notifyTestCompleted = async (userId, orgId, testData) => {
  return await notificationService.createNotification({
    user_id: userId,
    organization_id: orgId,
    type: 'test_completed',
    title: '검사 완료',
    message: `${testData.customerName}님이 ${testData.testType} 검사를 완료했습니다.`,
    data: {
      url: `/test-results/${testData.testId}`,
      customerId: testData.customerId,
      customerName: testData.customerName,
      testType: testData.testType
    }
  });
};

/**
 * Create notification when test is scored
 */
export const notifyTestScored = async (userId, orgId, scoreData) => {
  return await notificationService.createNotification({
    user_id: userId,
    organization_id: orgId,
    type: 'test_scored',
    title: '채점 완료',
    message: `${scoreData.customerName}님의 검사 채점이 완료되었습니다.`,
    data: {
      url: `/test-results/${scoreData.testId}`,
      customerId: scoreData.customerId,
      customerName: scoreData.customerName,
      totalScore: scoreData.totalScore
    }
  });
};

/**
 * Create notification when report is ready
 */
export const notifyReportReady = async (userId, orgId, reportData) => {
  return await notificationService.createNotification({
    user_id: userId,
    organization_id: orgId,
    type: 'report_ready',
    title: '보고서 생성 완료',
    message: `${reportData.customerName}님의 검사 보고서가 준비되었습니다.`,
    data: {
      url: `/reports/${reportData.reportId}`,
      customerId: reportData.customerId,
      customerName: reportData.customerName,
      reportType: reportData.reportType
    }
  });
};

/**
 * Create notification for new customer registration
 */
export const notifyNewCustomer = async (userId, orgId, customerData) => {
  return await notificationService.createNotification({
    user_id: userId,
    organization_id: orgId,
    type: 'new_customer',
    title: '신규 고객 등록',
    message: `${customerData.name}님이 검사를 시작했습니다.`,
    data: {
      url: `/customers/${customerData.id}`,
      customerId: customerData.id,
      customerName: customerData.name,
      testType: customerData.testType
    }
  });
};

/**
 * Create notification when test codes are running low
 */
export const notifyLowCodes = async (userId, orgId, codeData) => {
  return await notificationService.createNotification({
    user_id: userId,
    organization_id: orgId,
    type: 'low_codes',
    title: '검사 코드 부족 경고',
    message: `남은 검사 코드가 ${codeData.remaining}개입니다. 추가 구매를 고려해주세요.`,
    data: {
      url: '/test-management',
      remaining: codeData.remaining,
      threshold: codeData.threshold
    }
  });
};

/**
 * Create system alert notification
 */
export const notifySystemAlert = async (userId, orgId, alertData) => {
  return await notificationService.createNotification({
    user_id: userId,
    organization_id: orgId,
    type: 'system_alert',
    title: alertData.title || '시스템 알림',
    message: alertData.message,
    data: alertData.data || {}
  });
};

/**
 * Check and notify if codes are running low
 */
export const checkAndNotifyLowCodes = async (userId, orgId, availableCodes, threshold = 10) => {
  if (availableCodes <= threshold) {
    await notifyLowCodes(userId, orgId, {
      remaining: availableCodes,
      threshold
    });
  }
};

export default {
  notifyCodeGenerated,
  notifyCodeSent,
  notifyTestCompleted,
  notifyTestScored,
  notifyReportReady,
  notifyNewCustomer,
  notifyLowCodes,
  notifySystemAlert,
  checkAndNotifyLowCodes
};