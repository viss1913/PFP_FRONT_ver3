export interface FamilyOfficeBrokerOption {
    id: string;
    label: string;
    subtitle: string;
    project_key?: string;
    available: boolean;
}

/** Базовый пакет брокеров для саморегистрации FO с лендинга. */
export const FAMILY_OFFICE_BROKER_OPTIONS: FamilyOfficeBrokerOption[] = [
    {
        id: 'finam_pack',
        label: 'Финам и партнёры',
        subtitle: 'Финам · Сбер Страхование жизни · НПФ Ренессанс',
        project_key: 'pk_fedf4e6cb9ad07f8e7ce2c81',
        available: true,
    },
    {
        id: 'soon_1',
        label: 'Скоро',
        subtitle: 'Ещё один партнёр',
        available: false,
    },
    {
        id: 'soon_2',
        label: 'Скоро',
        subtitle: 'Ещё один партнёр',
        available: false,
    },
];

export const DEFAULT_FO_BROKER_OPTION_ID = 'finam_pack';

export function getDefaultFamilyOfficeBrokerOption(): FamilyOfficeBrokerOption {
    const found = FAMILY_OFFICE_BROKER_OPTIONS.find((o) => o.id === DEFAULT_FO_BROKER_OPTION_ID);
    return found ?? FAMILY_OFFICE_BROKER_OPTIONS[0];
}
