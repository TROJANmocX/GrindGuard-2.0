export const NOTIFICATION_STORAGE_KEYS = {
    DEADLINE_TIME: 'grindguard_deadline_time',
    LAST_NOTIFICATION_DATE: 'grindguard_last_notification_date',
};

const RUTHLESS_MESSAGES = [
    "You are disappointing your future self.",
    "Another day, another excuse? Grind now.",
    "Mediocrity is a choice you are making right now.",
    "Your competition is coding. You are not.",
    "Do you want to stay average forever?",
    "Comfort is the enemy of growth. Get up.",
    "Zero progress today. Zero respect earned.",
    "Tick tock. Your dreams are fading.",
];

export const getDeadline = (): string => {
    return localStorage.getItem(NOTIFICATION_STORAGE_KEYS.DEADLINE_TIME) || '20:00';
};

export const setDeadline = (time: string) => {
    localStorage.setItem(NOTIFICATION_STORAGE_KEYS.DEADLINE_TIME, time);
};

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

export const checkAndSendPressure = (todayStatus: 'present' | 'absent') => {
    if (todayStatus === 'present') return; // Safe

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Check if already sent today
    const lastSent = localStorage.getItem(NOTIFICATION_STORAGE_KEYS.LAST_NOTIFICATION_DATE);
    if (lastSent === todayStr) return;

    // Check deadline
    const deadline = getDeadline(); // "20:00"
    const [deadlineHour, deadlineMinute] = deadline.split(':').map(Number);

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const isPastDeadline =
        currentHour > deadlineHour ||
        (currentHour === deadlineHour && currentMinute >= deadlineMinute);

    if (isPastDeadline) {
        sendRuthlessNotification();
        localStorage.setItem(NOTIFICATION_STORAGE_KEYS.LAST_NOTIFICATION_DATE, todayStr);
    }
};

export const sendRuthlessNotification = () => {
    if (Notification.permission === 'granted') {
        const message = RUTHLESS_MESSAGES[Math.floor(Math.random() * RUTHLESS_MESSAGES.length)];
        new Notification("GrindGuard Alert", {
            body: message,
            icon: '/icon.png', // Assuming vite default or similar
            requireInteraction: true, // Requires user to dismiss it
        });
    }
};
