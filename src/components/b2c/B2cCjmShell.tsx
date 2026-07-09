import React, { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import B2cCjmSidebar from './B2cCjmSidebar';

export type B2cCjmShellStep = {
    title: string;
    icon: LucideIcon;
    stepNumber: number;
};

interface B2cCjmShellProps {
    currentStep: number;
    steps: B2cCjmShellStep[];
    inviterName?: string;
    clientAge?: number;
    mainVariant?: 'form' | 'goals' | 'assets' | 'reserve' | 'life' | 'risk';
    children: ReactNode;
}

const B2cCjmShell: React.FC<B2cCjmShellProps> = ({
    currentStep,
    steps,
    inviterName,
    clientAge,
    mainVariant = 'form',
    children,
}) => {
    const isWideMain =
        mainVariant === 'goals' ||
        mainVariant === 'assets' ||
        mainVariant === 'reserve' ||
        mainVariant === 'life' ||
        mainVariant === 'risk';
    const isLightWide = mainVariant === 'risk';
    return (
        <div className="b2c-cjm">
            <nav className="b2c-cjm__stepper" aria-label="Шаги анкеты">
                {steps.map((item, index) => {
                    const isActive = currentStep === item.stepNumber;
                    const isComplete = currentStep > item.stepNumber;
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.stepNumber}
                            className={`b2c-cjm__step${isActive ? ' b2c-cjm__step--active' : ''}${isComplete ? ' b2c-cjm__step--complete' : ''}`}
                        >
                            <div className="b2c-cjm__step-icon-wrap">
                                <span className="b2c-cjm__step-icon" aria-hidden>
                                    <Icon size={18} strokeWidth={2} />
                                </span>
                                {index < steps.length - 1 ? (
                                    <span className="b2c-cjm__step-line" aria-hidden />
                                ) : null}
                            </div>
                            <span className="b2c-cjm__step-label">{item.title}</span>
                        </div>
                    );
                })}
            </nav>

            <div className={`b2c-cjm__workspace${isWideMain ? ' b2c-cjm__workspace--goals' : ''}`}>
                <B2cCjmSidebar step={currentStep} inviterName={inviterName} clientAge={clientAge} />
                <div className={`b2c-cjm__main${isWideMain ? ' b2c-cjm__main--goals' : ''}`}>
                    <div
                        className={`b2c-cjm__card${isWideMain ? ' b2c-cjm__card--goals' : ''}${isLightWide ? ' b2c-cjm__card--risk' : ''}`}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default B2cCjmShell;
