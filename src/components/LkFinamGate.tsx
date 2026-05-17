import React from 'react';
import { useAgentProfile } from '../context/AgentProfileContext';
import FinamOnboardingModal from './FinamOnboardingModal';

interface LkFinamGateProps {
    children: React.ReactNode;
    enabled?: boolean;
}

/** Blur ЛК и модалка Finam-онбординга при ограниченном доступе. */
const LkFinamGate: React.FC<LkFinamGateProps> = ({ children, enabled = true }) => {
    const { shouldShowFinamOnboarding } = useAgentProfile();

    if (!enabled) {
        return <>{children}</>;
    }

    return (
        <>
            <div
                style={{
                    filter: shouldShowFinamOnboarding ? 'blur(6px)' : undefined,
                    pointerEvents: shouldShowFinamOnboarding ? 'none' : undefined,
                    userSelect: shouldShowFinamOnboarding ? 'none' : undefined,
                    minHeight: 'inherit',
                }}
            >
                {children}
            </div>
            <FinamOnboardingModal />
        </>
    );
};

export default LkFinamGate;
