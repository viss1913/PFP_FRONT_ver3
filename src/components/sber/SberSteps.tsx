import React from 'react';
import { sberLandingCopy } from '../../content/sberLandingCopy';
import { sberLandingAssets } from '../../content/sberLandingAssets';

interface SberStepsProps {
    onOpenFo: () => void;
}

const SberSteps: React.FC<SberStepsProps> = ({ onOpenFo }) => {
    const copy = sberLandingCopy.steps;

    return (
        <section className="sber-section sber-steps" id={copy.id}>
            <div className="sber-container">
                <h2 className="sber-section__title">{copy.title}</h2>
                <div className="sber-steps__layout">
                    <div>
                        <ol className="sber-steps__list">
                            {copy.items.map((item) => (
                                <li key={item.step} className="sber-steps__item">
                                    <span className="sber-steps__num" aria-hidden>
                                        {item.step}
                                    </span>
                                    <div>
                                        <h3>{item.title}</h3>
                                        <p>{item.text}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <div className="sber-steps__cta">
                            <button type="button" className="sber-btn sber-btn--primary" onClick={onOpenFo}>
                                {copy.cta}
                            </button>
                        </div>
                    </div>
                    <div className="sber-steps__visual" aria-hidden>
                        <img src={sberLandingAssets.icons.laptop} alt="" width={280} height={196} loading="lazy" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SberSteps;
