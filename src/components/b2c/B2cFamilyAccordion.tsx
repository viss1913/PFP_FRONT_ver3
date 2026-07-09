import React from 'react';
import { ChevronDown } from 'lucide-react';

interface B2cFamilyAccordionProps {
    id: string;
    title: string;
    subtitle?: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const B2cFamilyAccordion: React.FC<B2cFamilyAccordionProps> = ({
    id,
    title,
    subtitle,
    open,
    onToggle,
    children,
}) => (
    <section className={`b2c-family-accordion${open ? ' b2c-family-accordion--open' : ''}`}>
        <button
            type="button"
            className="b2c-family-accordion__trigger"
            aria-expanded={open}
            aria-controls={`${id}-panel`}
            onClick={onToggle}
        >
            <span className="b2c-family-accordion__trigger-text">
                <span className="b2c-family-accordion__title">{title}</span>
                {subtitle && !open ? (
                    <span className="b2c-family-accordion__subtitle">{subtitle}</span>
                ) : null}
            </span>
            <ChevronDown size={20} className="b2c-family-accordion__chevron" aria-hidden />
        </button>
        {open ? (
            <div id={`${id}-panel`} className="b2c-family-accordion__panel">
                {children}
            </div>
        ) : null}
    </section>
);

export default B2cFamilyAccordion;
