'use client';

import { useState, useEffect } from 'react';

interface DeviceType {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouch: boolean;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * Hook to detect device type based on screen size and touch capability.
 * Updates on window resize.
 */
export function useDeviceType(): DeviceType {
    const [deviceType, setDeviceType] = useState<DeviceType>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
    });

    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            setDeviceType({
                isMobile: width < MOBILE_BREAKPOINT,
                isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
                isDesktop: width >= TABLET_BREAKPOINT,
                isTouch,
            });
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return deviceType;
}
