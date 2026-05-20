import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import InviteActivatePage from './pages/invite/InviteActivatePage.tsx'
import AgentRegisterPage from './pages/register/AgentRegisterPage.tsx'
import SberLandingPage from './pages/sber/SberLandingPage.tsx'
import { AgentProfileProvider } from './context/AgentProfileContext.tsx'
import { resolvePublicRoute } from './routing/publicRoutes.ts'
import './index.css'
import './styles/lk-responsive.css'
import './components/FamilyOfficeInviteModal.css'

function Root() {
    const publicRoute = resolvePublicRoute(window.location.pathname)
    return (
        <AgentProfileProvider>
            {publicRoute === 'invite-activate' ? (
                <InviteActivatePage />
            ) : publicRoute === 'agent-register' ? (
                <AgentRegisterPage />
            ) : publicRoute === 'sber-landing' ? (
                <SberLandingPage />
            ) : (
                <App />
            )}
        </AgentProfileProvider>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>,
)
