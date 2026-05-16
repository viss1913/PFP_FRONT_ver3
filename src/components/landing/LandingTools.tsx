import React from 'react';
import type { LandingCopy } from '../../content/landingCopy';

const TOOL_ICONS = ['CRM', '∑', 'Doc', '◎'];

interface LandingToolsProps {
    copy: LandingCopy;
}

const LandingTools: React.FC<LandingToolsProps> = ({ copy }) => (
    <section id="tools" className="landing-section landing-section--light">
        <div className="landing-container">
            <h2 className="landing-section-title">{copy.tools.title}</h2>
            <p className="landing-section-subtitle">{copy.tools.subtitle}</p>
            <div className="landing-tools__list">
                {copy.tools.items.map((item, i) => (
                    <div key={item.title} className="landing-tool-item">
                        <div className="landing-tool-item__icon">{TOOL_ICONS[i] ?? '✦'}</div>
                        <div>
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default LandingTools;
