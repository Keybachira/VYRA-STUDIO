//Aquiles_Bachira
import type { ReactElement } from 'react'
import { Monitor } from 'lucide-react'
import { usePermissions } from '../hooks/use-permissions'
import { t } from '../../../../../shared/i18n'

function detectPlatform(): string {
  if (navigator.userAgent.indexOf('Mac') !== -1) return 'mac'
  if (navigator.userAgent.indexOf('Win') !== -1) return 'win'
  return 'default'
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: 'clamp(12px, 4vw, 24px)',
    background: 'rgba(10, 10, 12, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    color: '#ffffff',
    zIndex: 9999,
    overflow: 'hidden' as const,
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
    gap: '2px' //Aquiles_Bachira
  },
  iconWrap: {
    background: 'rgba(255, 159, 10, 0.18)',
    padding: 'clamp(8px, 2.5vw, 14px)',
    borderRadius: '50%',
    marginBottom: 'clamp(4px, 1.5vw, 10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 159, 10, 0.35)',
    flexShrink: 0
  },
  title: {
    fontSize: 'clamp(16px, 4vw, 20px)',
    fontWeight: 700,
    margin: '0 0 4px',
    maxWidth: '90%',
    lineHeight: 1.2
  },
  message: {
    fontSize: 'clamp(12px, 3vw, 14px)',
    color: 'rgba(255, 255, 255, 0.7)',
    margin: '0 0 6px',
    maxWidth: 'min(280px, 90%)',
    lineHeight: 1.4
  },
  instructions: {
    fontSize: 'clamp(11px, 2.8vw, 12px)',
    color: 'rgba(255, 255, 255, 0.5)',
    margin: '0 0 10px',
    maxWidth: 'min(260px, 90%)',
    lineHeight: 1.4,
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 3vw, 14px)'
  }, //Aquiles_Bachira
  retryButton: {
    padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 14px)',
    background: 'rgba(255, 159, 10, 0.2)',
    border: '1px solid rgba(255, 159, 10, 0.4)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    whiteSpace: 'nowrap' as const,
    flex: '0 1 auto',
    minWidth: '90px',
    maxWidth: '130px'
  }, //Aquiles_Bachira
  deniedStatus: {
    position: 'absolute' as const,
    bottom: '8px',
    fontSize: '10px',
    color: 'rgba(255, 159, 10, 0.5)',
    maxWidth: '90%',
    textAlign: 'center' as const
  }
}

export function ScreenPermissionErrorOverlay({
  language = 'en',
  onRetry
}: {
  language?: string
  onRetry?: () => void | Promise<void>
}): ReactElement {
  const lang = (language === 'pt' ? 'pt' : 'en') as 'en' | 'pt'
  const { screenPermission, checkPermissions } = usePermissions()
  const platform = detectPlatform()

  const handleRetry = async (): Promise<void> => {
    await checkPermissions()
    if (onRetry) {
      await onRetry()
      return
    }
    window.location.reload()
  }

  const getInstructions = (): string => {
    if (platform === 'mac') return t('screen.error.mac', lang)
    if (platform === 'win') return t('screen.error.win', lang)
    return t('screen.error.default', lang)
  }

  return (
    <>
      <style>{`.perm-overlay::-webkit-scrollbar{display:none} @media (max-width: 380px){.perm-actions{flex-direction:column !important;width:100%}.perm-actions button{width:100%}} @media (max-height: 420px){.perm-overlay{padding-top:12px !important;justify-content:flex-start !important}}`}</style>
      <div style={styles.overlay} className="perm-overlay">
        <div style={styles.iconWrap}>
          <Monitor
            size={44}
            color="#ff9f0a"
            style={{ width: 'clamp(28px, 8vw, 44px)', height: 'clamp(28px, 8vw, 44px)' }}
          />
        </div>
        <h2 style={styles.title}>{t('screen.error.title', lang)}</h2>
        <p style={styles.message}>{t('screen.error.message', lang)}</p>
        <p style={styles.instructions}>{getInstructions()}</p>

        <div
          className="perm-actions"
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: '90%',
            width: 'auto'
          }}
        >
          {platform === 'mac' && (
            <button
              onClick={() => window.electron?.ipcRenderer.invoke('open-system-settings', 'screen')}
              style={styles.retryButton}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 159, 10, 0.35)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 159, 10, 0.2)')}
            >
              {t('screen.error.openSettings', lang)}
            </button>
          )}
          <button
            onClick={handleRetry}
            style={styles.retryButton}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 159, 10, 0.35)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 159, 10, 0.2)')}
          >
            {t('screen.error.tryAgain', lang)}
          </button>
        </div>

        {screenPermission === 'denied' && (
          <div style={styles.deniedStatus}>{t('screen.status.denied', lang)}</div>
        )}
      </div>
    </>
  )
}
