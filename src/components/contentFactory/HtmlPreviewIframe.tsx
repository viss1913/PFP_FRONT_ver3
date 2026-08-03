import React from 'react';

interface HtmlPreviewIframeProps {
    html: string | null | undefined;
    title: string;
    className?: string;
}

const HtmlPreviewIframe: React.FC<HtmlPreviewIframeProps> = ({ html, title, className }) => {
    if (!html) {
        return (
            <div className="cf-preview-empty">
                Превью недоступно
            </div>
        );
    }

    return (
        <iframe
            srcDoc={html}
            sandbox="allow-same-origin"
            title={title}
            className={className ?? 'cf-preview-iframe'}
        />
    );
};

export default HtmlPreviewIframe;
