import React from 'react';
type Variant = 'primary' | 'secondary' | 'dark-secondary';

interface LandingCtaButtonProps {
    variant?: Variant;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

/** CTA button wired to landing actions (not anchor) */
const LandingCtaButton: React.FC<LandingCtaButtonProps> = ({
    variant = 'primary',
    children,
    className = '',
    onClick,
}) => (
    <button
        type="button"
        className={`landing-btn landing-btn--${variant} ${className}`.trim()}
        onClick={onClick}
    >
        {children}
    </button>
);

export default LandingCtaButton;
