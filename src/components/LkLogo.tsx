import React from 'react';

/** Логотип ЛК: Family Office | BankFuture */
const LkLogo: React.FC<{ className?: string }> = ({ className = 'lk-header__logo' }) => (
    <div className={className} aria-label="Family Office BankFuture">
        <span className="lk-header__logo-fo">Family Office</span>
        <span className="lk-header__logo-sep" aria-hidden>
            |
        </span>
        <span className="lk-header__logo-bf">BankFuture</span>
    </div>
);

export default LkLogo;
