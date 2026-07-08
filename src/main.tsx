import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import InviteActivatePage from './pages/invite/InviteActivatePage.tsx'
import AgentRegisterPage from './pages/register/AgentRegisterPage.tsx'
import SberLandingPage from './pages/sber/SberLandingPage.tsx'
import AtbMassEntryPage from './pages/atb/AtbMassEntryPage.tsx'
import B2cGuestPlanPage from './pages/b2c/B2cGuestPlanPage.tsx'
import { AgentProfileProvider } from './context/AgentProfileContext.tsx'
import { resolvePublicRoute } from './routing/publicRoutes.ts'
import { applyPageSeo, SEO } from './seo/pageSeo'
import './index.css'
import './styles/lk-responsive.css'
import './components/FamilyOfficeInviteModal.css'
import { redirectRootClientReferralToPlan } from './utils/clientB2cAttribution.ts'

redirectRootClientReferralToPlan()

function applyPublicRouteSeo(route: ReturnType<typeof resolvePublicRoute>): void {
    if (route === 'sber-landing') applyPageSeo(SEO.sber);
    else if (route === 'invite-activate' || route === 'agent-register') applyPageSeo(SEO.authFlow);
    else if (route === 'atb-mass') applyPageSeo(SEO.atbMass);
    else if (route === 'b2c-plan') applyPageSeo(SEO.b2cPlan);
}

function Root() {
    const publicRoute = resolvePublicRoute(window.location.pathname)
    useEffect(() => {
        if (publicRoute) applyPublicRouteSeo(publicRoute);
    }, [publicRoute]);
    return (
        <AgentProfileProvider>
            {publicRoute === 'invite-activate' ? (
                <InviteActivatePage />
            ) : publicRoute === 'agent-register' ? (
                <AgentRegisterPage />
            ) : publicRoute === 'sber-landing' ? (
                <SberLandingPage />
            ) : publicRoute === 'atb-mass' ? (
                <AtbMassEntryPage />
            ) : publicRoute === 'b2c-plan' ? (
                <B2cGuestPlanPage />
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
