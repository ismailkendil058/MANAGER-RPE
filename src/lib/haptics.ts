export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (!window.navigator || !window.navigator.vibrate) return;

    switch (type) {
        case 'light':
            window.navigator.vibrate(10);
            break;
        case 'medium':
            window.navigator.vibrate(20);
            break;
        case 'heavy':
            window.navigator.vibrate(40);
            break;
        case 'success':
            window.navigator.vibrate([10, 50, 10]);
            break;
        case 'warning':
            window.navigator.vibrate([30, 50, 30]);
            break;
        case 'error':
            window.navigator.vibrate([50, 100, 50, 100, 50]);
            break;
    }
};
