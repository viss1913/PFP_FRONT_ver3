export const PHONE_MASK_TEMPLATE = '+7(___)___-__-__';
export const PHONE_PLACEHOLDER = PHONE_MASK_TEMPLATE;

export const getRussianPhoneDigits = (rawValue: string): string => {
    let digits = rawValue.replace(/\D/g, '');
    if (digits.startsWith('7') || digits.startsWith('8')) {
        digits = digits.substring(1);
    }
    return digits.slice(0, 10);
};

export const formatRussianPhoneInput = (rawValue: string): string => {
    const digits = getRussianPhoneDigits(rawValue);
    const maskChars = PHONE_MASK_TEMPLATE.split('');
    let digitIndex = 0;

    for (let i = 0; i < maskChars.length; i += 1) {
        if (maskChars[i] === '_') {
            if (digitIndex < digits.length) {
                maskChars[i] = digits[digitIndex];
                digitIndex += 1;
            }
        }
    }

    return maskChars.join('');
};

export const getPhoneInputCaretPosition = (maskedValue: string): number => {
    const nextPlaceholder = maskedValue.indexOf('_');
    return nextPlaceholder >= 0 ? nextPlaceholder : maskedValue.length;
};

export const hasCompleteRussianPhone = (rawValue: string): boolean => {
    return getRussianPhoneDigits(rawValue).length === 10;
};
