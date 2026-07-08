import React, { useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { b2cVisualAssets } from '../../content/b2cAssets';
import { getB2cCjmCoachMessage } from '../../content/b2cCjmCoachCopy';

interface B2cCjmSidebarProps {
    step: number;
    inviterName?: string;
}

const B2cCjmSidebar: React.FC<B2cCjmSidebarProps> = ({ step, inviterName }) => {
    const fullMessage = useMemo(() => getB2cCjmCoachMessage(step, inviterName), [step, inviterName]);
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
    }, [fullMessage, step]);

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

            <div className="b2c-cjm-sidebar__composer">
                <input
                    type="text"
                    className="b2c-cjm-sidebar__input"
                    placeholder="Напишите сообщение..."
                    disabled
                    aria-label="Сообщение консультанту"
                />
                <button type="button" className="b2c-cjm-sidebar__send" disabled aria-label="Отправить">
                    <Send size={18} strokeWidth={2} />
                </button>
            </div>
        </aside>
    );
};

export default B2cCjmSidebar;
