import React, { useMemo } from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import { landingVideoUrl, landingVisualAssets } from '../../content/landingAssets';
import LandingSection from './LandingSection';
import { trackLandingEvent, getTrackingContext } from '../../utils/landingAnalytics';
import { useLandingActions } from '../../context/LandingActionsContext';

interface LandingEducationProps {
    copy: LandingCopy;
}

function isEmbedUrl(url: string): boolean {
    return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
}

function toEmbedUrl(url: string): string {
    if (url.includes('youtube.com/watch')) {
        const id = new URL(url).searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
    }
    return url;
}

const LandingEducation: React.FC<LandingEducationProps> = ({ copy }) => {
    const educationPoster = landingVisualAssets.educationPoster;
    const { lang, variant } = useLandingActions();
    const embedUrl = useMemo(
        () => (landingVideoUrl && isEmbedUrl(landingVideoUrl) ? toEmbedUrl(landingVideoUrl) : ''),
        []
    );

    const handlePlay = () => {
        const ctx = getTrackingContext(lang, variant);
        trackLandingEvent('cta_click', ctx, { cta: 'video', source: 'education' });
        if (landingVideoUrl && !embedUrl) {
            window.open(landingVideoUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <LandingSection id="education" className="landing-section">
            <div className="landing-container landing-education__grid">
                <div>
                    <h2 className="landing-section-title">{copy.education.title}</h2>
                    <p className="landing-section-subtitle">{copy.education.subtitle}</p>
                    <ul className="landing-education__features">
                        {copy.education.features.map((f) => (
                            <li key={f}>{f}</li>
                        ))}
                    </ul>
                    <p className="landing-education__disclaimer">{copy.education.disclaimer}</p>
                </div>
                {embedUrl ? (
                    <div className="landing-video-embed" data-video-url={landingVideoUrl}>
                        <iframe
                            src={embedUrl}
                            title={copy.education.videoTitle}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    <div
                        className="landing-video-slot"
                        role="img"
                        aria-label={copy.education.videoAria}
                        data-video-url={landingVideoUrl || undefined}
                        onClick={handlePlay}
                        onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
                        tabIndex={0}
                    >
                        <img className="landing-video-slot__poster" src={educationPoster} alt="" loading="lazy" />
                        <div className="landing-video-slot__overlay">
                            <button
                                type="button"
                                className="landing-video-slot__play"
                                aria-label={copy.education.videoTitle}
                            >
                                ▶
                            </button>
                            <span className="landing-video-slot__title">{copy.education.videoTitle}</span>
                        </div>
                    </div>
                )}
            </div>
        </LandingSection>
    );
};

export default LandingEducation;
