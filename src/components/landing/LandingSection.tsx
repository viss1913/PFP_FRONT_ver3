import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface LandingSectionProps {
    children: React.ReactNode;
    className?: string;
    id?: string;
}

const LandingSection: React.FC<LandingSectionProps> = ({ children, className = '', id }) => {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <motion.section
            ref={ref}
            id={id}
            className={className}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            {children}
        </motion.section>
    );
};

export default LandingSection;
