import React from 'react';

interface B2cPlanOrchestratorShellProps {
    chat: React.ReactNode;
    children: React.ReactNode;
    variant?: 'welcome' | 'split';
}

const B2cPlanOrchestratorShell: React.FC<B2cPlanOrchestratorShellProps> = ({
    chat,
    children,
    variant = 'split',
}) => (
    <section className={`b2c-plan-orchestrator b2c-plan-orchestrator--${variant}`}>
        {chat}
        <div className="b2c-plan-orchestrator__content">{children}</div>
    </section>
);

export default B2cPlanOrchestratorShell;
