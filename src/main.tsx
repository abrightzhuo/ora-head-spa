import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import App from './App'
import { CustomerAuthProvider } from './contexts/CustomerAuthContext'
import './index.css'

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('is-native-app')
  void StatusBar.setStyle({ style: Style.Dark })
  void StatusBar.setBackgroundColor({ color: '#f7f3ec' })
  void StatusBar.setOverlaysWebView({ overlay: false })

  void CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      void CapacitorApp.exitApp()
    }
  })

  void CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    const incoming = new URL(url)
    if (incoming.hostname === 'www.myoraspa.com') {
      window.location.href = `${incoming.pathname}${incoming.search}${incoming.hash}`
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CustomerAuthProvider>
      <App />
    </CustomerAuthProvider>
  </StrictMode>,
)
