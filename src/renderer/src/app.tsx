import React, { useEffect, useState } from 'react'
import { CameraPage } from './domains/camera/camera.page'
import { SettingsPage } from './domains/settings/settings.page'
import { CountdownPage } from './domains/recording/countdown.page'
import { RecordingWorkerPage } from './domains/recording/recording-worker.page'
import { CommandPalettePage } from './domains/palette/command-palette.page'

function App(): React.JSX.Element {
  const [route, setRoute] = useState<string>('')
  useEffect(() => {
    const handleHashChange = (): void => {
      setRoute(window.location.hash)
    }
    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])
  if (route === '#/settings') {
    return <SettingsPage />
  }
  if (route === '#/countdown') {
    return <CountdownPage />
  }
  if (route === '#/worker') {
    return <RecordingWorkerPage />
  }
  if (route === '#/palette') {
    return <CommandPalettePage />
  }
  return <CameraPage />
}

export default App
