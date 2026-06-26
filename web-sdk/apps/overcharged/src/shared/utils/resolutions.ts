export interface ResolutionPreset {
    name: string;
    value: string;
    width: number;
    height: number;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
    { name: 'Desktop (1200×675)', value: 'desktop',    width: 1200, height: 675 },
    { name: 'Laptop (1024×576)',  value: 'laptop',     width: 1024, height: 576 },
    { name: 'Popout L (800×450)', value: 'popoutL',    width: 800,  height: 450 },
    { name: 'Popout S (400×225)', value: 'popoutS',    width: 400,  height: 225 },
    { name: 'Mobile L (425×812)', value: 'mobileL',    width: 425,  height: 812 },
    { name: 'Mobile M (375×667)', value: 'mobileM',    width: 375,  height: 667 },
    { name: 'Mobile S (320×568)', value: 'mobileS',    width: 320,  height: 568 },
];

export function detectResolution(): ResolutionPreset {
    const width  = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height >= width;

    if (isPortrait) {
        if (width <= 360) return RESOLUTION_PRESETS.find(p => p.value === 'mobileS')!;
        if (width <= 390) return RESOLUTION_PRESETS.find(p => p.value === 'mobileM')!;
        return RESOLUTION_PRESETS.find(p => p.value === 'mobileL')!;
    } else {
        if (height <= 400 || width <= 500) return RESOLUTION_PRESETS.find(p => p.value === 'popoutS')!;
        if (width  <= 800 || height <= 500) return RESOLUTION_PRESETS.find(p => p.value === 'popoutL')!;
        if (width  <= 1100 || height <= 650) return RESOLUTION_PRESETS.find(p => p.value === 'laptop')!;
        return RESOLUTION_PRESETS.find(p => p.value === 'desktop')!;
    }
}

export function getResolutionFromRGSOrURL(): ResolutionPreset | null {
    const params     = new URLSearchParams(window.location.search);
    const urlWidth   = params.get('width');
    const urlHeight  = params.get('height');
    const deviceType = (params.get('device') || params.get('deviceType'))?.toLowerCase();

    if (urlWidth && urlHeight) {
        const w = parseInt(urlWidth, 10);
        const h = parseInt(urlHeight, 10);
        const exactMatch = RESOLUTION_PRESETS.find(p => p.width === w && p.height === h);
        if (exactMatch) return exactMatch;
        return { name: `Custom (${w}×${h})`, value: `custom-${w}x${h}`, width: w, height: h };
    }

    if (deviceType === 'mobile')  return RESOLUTION_PRESETS.find(p => p.value === 'mobileL')!;
    if (deviceType === 'desktop') return RESOLUTION_PRESETS.find(p => p.value === 'desktop')!;
    return null;
}
