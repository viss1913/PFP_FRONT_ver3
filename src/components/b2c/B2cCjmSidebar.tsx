import React, { useEffect, useMemo, useState } from 'react';
import { b2cVisualAssets } from '../../content/b2cAssets';
import { getB2cCjmCoachMessage } from '../../content/b2cCjmCoachCopy';

interface B2cCjmSidebarProps {
    step: number;
    inviterName?: string;
    clientAge?: number;
    /** Живое сообщение из SSE оркестратора (fallback — статичный coach copy) */
    liveMessage?: string;
}

const B2cCjmSidebar: React.FC<B2cCjmSidebarProps> = ({ step, inviterName, clientAge = 39, liveMessage }) => {
    const fallbackMessage = useMemo(
        () => getB2cCjmCoachMessage(step, inviterName, clientAge),
        [step, inviterName, clientAge],
    );
    const fullMessage = liveMessage?.trim() || fallbackMessage;
    const [visibleText, setVisibleText] = useState('');
    const [streamDone, setStreamDone] = useState(false);

    useEffect(() => {
        setVisibleText('');
        setStreamDone(false);
        let index = 0;
        const interval = window.setInterval(() => {
            index += 1;
            setVisibleText(fullMessage.slice(0, index));
            if (index >= fullMessage.length) {
                setStreamDone(true);
                window.clearInterval(interval);
            }
        }, 14);
        return () => window.clearInterval(interval);
    }, [fullMessage, step, liveMessage]);

    return (
        <aside className="b2c-cjm-sidebar" aria-label="AI-консультант">
            <div className="b2c-cjm-sidebar__profile">
                <img
                    src={b2cVisualAssets.victoriaAvatar}
                    alt="Виктория"
                    className="b2c-cjm-sidebar__avatar"
                />
                <div className="b2c-cjm-sidebar__profile-text">
                    <div className="b2c-cjm-sidebar__name">Виктория</div>
                    <div className="b2c-cjm-sidebar__role">AI-консультант</div>
                </div>
                <span className="b2c-cjm-sidebar__online">Online</span>
            </div>

            <div className="b2c-cjm-sidebar__chat" aria-live="polite">
                <div className="b2c-cjm-sidebar__bubble">
                    <p className="b2c-cjm-sidebar__message">
                        {visibleText}
                        {!streamDone ? <span className="b2c-cjm-sidebar__caret" aria-hidden /> : null}
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default B2cCjmSidebar;
