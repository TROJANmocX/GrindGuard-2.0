import { useState, useEffect } from 'react';

export const useCountUp = (end: number, duration: number = 1000) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const startCount = count; // Start from current visual state

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing function (easeOutExpo)
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const current = Math.floor(startCount + (end - startCount) * ease);
            setCount(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [end, duration]);

    return count;
};
