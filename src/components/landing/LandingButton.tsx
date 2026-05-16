import React from 'react';

type Variant = 'primary' | 'secondary' | 'dark-secondary';

interface LandingButtonProps {
    variant?: Variant;
    children: React.ReactNode;
    className?: string;
    /** TODO: replace with real URLs or login flow */
    href?: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const LandingButton: React.FC<LandingButtonProps> = ({
    variant = 'primary',
    children,
    className = '',
    href = '#',
    onClick,
}) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) {
            onClick(e);
            return;
        }
        if (href === '#') {
            e.preventDefault();
        }
    };

    return (
        <a
            href={href}
            className={`landing-btn landing-btn--${variant} ${className}`.trim()}
            onClick={handleClick}
        >
            {children}
        </a>
    );
};

export default LandingButton;
