const PHONE_PREFIX = '+7 (';

export const formatRussianPhoneInput = (rawValue: string): string => {
    let digits = rawValue.replace(/\D/g, '');

    // Ignore country code if user types or pastes it.
    if (digits.startsWith('7') || digits.startsWith('8')) {
        digits = digits.substring(1);
    }

    const nums = digits.slice(0, 10);
    let formatted = PHONE_PREFIX;

    if (nums.length > 0) {
        formatted += nums.substring(0, 3);
    }
    if (nums.length >= 4) {
        formatted += ') ' + nums.substring(3, 6);
    }
    if (nums.length >= 7) {
        formatted += '-' + nums.substring(6, 8);
    }
    if (nums.length >= 9) {
        formatted += '-' + nums.substring(8, 10);
    }

    return formatted;
};

export const PHONE_PLACEHOLDER = '+7 (999) 000-00-00';
