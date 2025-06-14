import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useSessionStore = create(
  persist(
    (set) => ({
      // 세션 설정
      sessionSettings: {
        timeout: 30, // 분 단위
        warningTime: 5, // 분 단위
        autoLogout: true,
        rememberActivity: true
      },

      // 세션 설정 업데이트
      updateSessionSettings: (settings) => set((state) => ({
        sessionSettings: {
          ...state.sessionSettings,
          ...settings
        }
      })),

      // 세션 타임아웃 설정 (분 단위)
      setSessionTimeout: (minutes) => set((state) => ({
        sessionSettings: {
          ...state.sessionSettings,
          timeout: minutes
        }
      })),

      // 경고 시간 설정 (분 단위)
      setWarningTime: (minutes) => set((state) => ({
        sessionSettings: {
          ...state.sessionSettings,
          warningTime: minutes
        }
      })),

      // 자동 로그아웃 토글
      toggleAutoLogout: () => set((state) => ({
        sessionSettings: {
          ...state.sessionSettings,
          autoLogout: !state.sessionSettings.autoLogout
        }
      })),

      // 설정 초기화
      resetSessionSettings: () => set({
        sessionSettings: {
          timeout: 30,
          warningTime: 5,
          autoLogout: true,
          rememberActivity: true
        }
      })
    }),
    {
      name: 'session-settings',
      partialize: (state) => ({ sessionSettings: state.sessionSettings })
    }
  )
)

export default useSessionStore