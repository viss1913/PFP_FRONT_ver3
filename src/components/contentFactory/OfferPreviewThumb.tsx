import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

/** A4 portrait @ ~96dpi — как finam-a4-portrait-light */
const A4_BASE_W = 794;
const A4_BASE_H = 1123;

interface OfferPreviewThumbProps {
    title: string;
    html?: string | null;
    loading?: boolean;
    className?: string;
    onClick?: () => void;
    emptyLabel?: string;
}

const OfferPreviewThumb: React.FC<OfferPreviewThumbProps> = ({
    title,
    html,
    loading = false,
    className,
    onClick,
    emptyLabel = 'Превью загружается…',
}) => {
    const boxRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(0.2);

    const measure = useCallback(() => {
        const box = boxRef.current;
        if (!box) return;
        const w = box.clientWidth || 1;
        const h = box.clientHeight || 1;
        const byWidth = w / A4_BASE_W;
        const byHeight = h / A4_BASE_H;
        setScale(Math.min(byWidth, byHeight, 1));
    }, []);

    useLayoutEffect(() => {
        measure();
        const box = boxRef.current;
        if (!box) return;
        const ro = new ResizeObserver(measure);
        ro.observe(box);
        window.addEventListener('resize', measure);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [measure, html]);

    const clipW = A4_BASE_W * scale;
    const clipH = A4_BASE_H * scale;

    const rootClass = ['cf-offer-thumb', className].filter(Boolean).join(' ');
    const interactive = typeof onClick === 'function';

    return (
        <div
            ref={boxRef}
            className={rootClass}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={onClick}
            onKeyDown={
                interactive
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onClick?.();
                          }
                      }
                    : undefined
            }
        >
            {loading ? (
                <div className="cf-offer-thumb__state">
                    <Loader2 size={18} className="animate-spin" />
                </div>
            ) : html ? (
                <div
                    className="cf-offer-thumb__clip"
                    style={{ width: clipW, height: clipH }}
                >
                    <iframe
                        srcDoc={html}
                        sandbox="allow-same-origin"
                        title={title}
                        className="cf-offer-thumb__iframe"
                        style={{
                            width: A4_BASE_W,
                            height: A4_BASE_H,
                            transform: `scale(${scale})`,
                        }}
                    />
                </div>
            ) : (
                <div className="cf-offer-thumb__state">{emptyLabel}</div>
            )}
        </div>
    );
};

export default OfferPreviewThumb;
