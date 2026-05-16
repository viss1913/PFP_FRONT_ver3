import React, { useState } from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import LandingSection from './LandingSection';

interface LandingFaqProps {
    copy: LandingCopy;
}

const LandingFaq: React.FC<LandingFaqProps> = ({ copy }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <LandingSection id="faq" className="landing-section landing-section--light">
            <div className="landing-container">
                <h2 className="landing-section-title">{copy.faq.title}</h2>
                <div className="landing-faq">
                    {copy.faq.items.map((item, i) => {
                        const open = openIndex === i;
                        return (
                            <div key={item.q} className={`landing-faq__item${open ? ' open' : ''}`}>
                                <button
                                    type="button"
                                    className="landing-faq__question"
                                    aria-expanded={open}
                                    onClick={() => setOpenIndex(open ? null : i)}
                                >
                                    {item.q}
                                    <span className="landing-faq__icon">{open ? '−' : '+'}</span>
                                </button>
                                {open && <p className="landing-faq__answer">{item.a}</p>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </LandingSection>
    );
};

export default LandingFaq;
