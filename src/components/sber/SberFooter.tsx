import React from 'react';
import { sberLandingCopy } from '../../content/sberLandingCopy';
import { getSberBrandLabel, getSberCopyright, sberLandingAssets } from '../../content/sberLandingAssets';

const SberFooter: React.FC = () => {
    const copy = sberLandingCopy.footer;
    const copyright = getSberCopyright();

    return (
        <footer className="sber-footer" id="footer-contacts">
            <div className="sber-container sber-footer__inner">
                <div className="sber-footer__brand">
                    <div className="sber-footer__brand-row">
                        <img src={sberLandingAssets.logo} alt="" width={32} height={32} />
                        <span className="sber-header__product">{getSberBrandLabel()}</span>
                    </div>
                    {copyright && <p className="sber-footer__copyright">{copyright}</p>}
                </div>
                <nav className="sber-footer__links" aria-label="Подвал">
                    {copy.links.map((link) => (
                        <a key={link.label} href={link.href}>
                            {link.label}
                        </a>
                    ))}
                </nav>
                <a className="sber-footer__phone" href={copy.phoneHref}>
                    {copy.phone}
                </a>
            </div>
        </footer>
    );
};

export default SberFooter;
