import { Modal } from '../shared/components'
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardNavigation'
import './KeyboardShortcutsModal.css'

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  // 단축키를 카테고리별로 그룹화
  const groupedShortcuts = {
    navigation: {
      title: '네비게이션',
      shortcuts: Object.entries(KEYBOARD_SHORTCUTS)
        .filter(([key]) => key.includes('alt+') && !key.includes('alt+1'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    },
    actions: {
      title: '액션',
      shortcuts: Object.entries(KEYBOARD_SHORTCUTS)
        .filter(([key]) => key.includes('ctrl+'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    },
    accessibility: {
      title: '접근성',
      shortcuts: Object.entries(KEYBOARD_SHORTCUTS)
        .filter(([key]) => key.includes('alt+1') || key.includes('alt+2') || key.includes('alt+3'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    }
  }

  // 키 조합을 사용자 친화적으로 표시
  const formatKey = (key) => {
    return key
      .split('+')
      .map(k => {
        switch(k) {
          case 'ctrl': return 'Ctrl'
          case 'alt': return 'Alt'
          case 'shift': return 'Shift'
          case 'meta': return '⌘'
          default: return k.toUpperCase()
        }
      })
      .join(' + ')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="keyboard-shortcuts-modal">
        <div className="modal-header">
          <h2>
            <i className="fas fa-keyboard me-2"></i>
            키보드 단축키
          </h2>
        </div>

        <div className="shortcuts-content">
          {Object.entries(groupedShortcuts).map(([category, { title, shortcuts }]) => (
            <div key={category} className="shortcut-category">
              <h3>{title}</h3>
              <div className="shortcut-list">
                {Object.entries(shortcuts).map(([key, value]) => (
                  <div key={key} className="shortcut-item">
                    <span className="shortcut-key">
                      {formatKey(key)}
                    </span>
                    <span className="shortcut-description">
                      {value.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="shortcut-category">
            <h3>일반 네비게이션</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <span className="shortcut-key">Tab</span>
                <span className="shortcut-description">다음 요소로 이동</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Shift + Tab</span>
                <span className="shortcut-description">이전 요소로 이동</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Enter</span>
                <span className="shortcut-description">선택/실행</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Escape</span>
                <span className="shortcut-description">닫기/취소</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">↑ ↓</span>
                <span className="shortcut-description">목록에서 이동</span>
              </div>
            </div>
          </div>

          <div className="shortcut-category">
            <h3>검사 채점 단축키</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <span className="shortcut-key">1, 2, 3, 4</span>
                <span className="shortcut-description">답안 선택 (매우 그렇다 ~ 매우 아니다)</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">→</span>
                <span className="shortcut-description">다음 문항</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">←</span>
                <span className="shortcut-description">이전 문항</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <p className="help-text">
            <i className="fas fa-info-circle me-1"></i>
            단축키는 언제든지 <kbd>Ctrl</kbd> + <kbd>/</kbd>를 눌러 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default KeyboardShortcutsModal