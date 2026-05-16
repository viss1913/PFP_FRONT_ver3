import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import InviteActivatePage from './pages/invite/InviteActivatePage.tsx'
import { resolvePublicRoute } from './routing/publicRoutes.ts'
import './index.css'

function Root() {
    const publicRoute = resolvePublicRoute(window.location.pathname)
    if (publicRoute === 'invite-activate') {
        return <InviteActivatePage />
    }
    return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Root />
    </React.StrictMode>,
)
