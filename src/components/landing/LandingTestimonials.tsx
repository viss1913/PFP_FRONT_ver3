import React from 'react';
import type { LandingCopy } from '../../content/landingCopy';
import { landingVisualAssets } from '../../content/landingAssets';

interface LandingTestimonialsProps {
    copy: LandingCopy;
}

const LandingTestimonials: React.FC<LandingTestimonialsProps> = ({ copy }) => {
    const avatars = landingVisualAssets.testimonialAvatars;

    return (
        <section className="landing-section">
            <div className="landing-container">
                <h2 className="landing-section-title">{copy.testimonials.title}</h2>
                <div className="landing-testimonials__grid">
                    {copy.testimonials.items.map((item, i) => (
                        <article key={item.name} className="landing-testimonial-card">
                            <img
                                className="landing-testimonial-card__avatar"
                                src={avatars[i] ?? avatars[0]}
                                alt=""
                            />
                            <div className="landing-testimonial-card__stars">★★★★★</div>
                            <p className="landing-testimonial-card__quote">&ldquo;{item.quote}&rdquo;</p>
                            <p className="landing-testimonial-card__name">{item.name}</p>
                            <p className="landing-testimonial-card__role">{item.role}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LandingTestimonials;
