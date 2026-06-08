import type {
    AgentClientPatchBody,
    Asset,
    AssetType,
    Client,
    ClientCardContactsForm,
    ClientCardCreditRow,
    ClientCardDirtySection,
    ClientCardFormState,
    FamilyProfile,
} from '../types/client';

const CREDIT_TYPE_NAMES: Record<ClientCardCreditRow['type'], string> = {
    MORTGAGE: 'Ипотека',
    CONSUMER_LOAN: 'Потребительский кредит',
    CREDIT_CARD: 'Кредитная карта',
    AUTO_LOAN: 'Автокредит',
    OTHER: 'Кредит',
};

function defaultFamilyProfile(): FamilyProfile {
    return {
        marital_status: undefined,
        children: [],
        contacts: [],
        spouse: {},
        family_obligations: [],
        real_estate: [],
    };
}

function mapCreditsFromClient(client: Client): ClientCardCreditRow[] {
    const raw = client.credits?.length
        ? client.credits
        : (client.liabilities || []).map((l) => ({
              type: l.type,
              balance: l.remaining_amount,
              monthlyPayment: l.monthly_payment,
              rate: l.interest_rate ?? 0,
          }));
    return raw.map((c) => ({
        type: (c.type || 'OTHER') as ClientCardCreditRow['type'],
        balance: Number(c.balance) || 0,
        monthlyPayment: Number(c.monthlyPayment) || 0,
        rate: Number(c.rate) || 0,
        name: (c as { name?: string }).name,
    }));
}

function mapAssetsFromClient(client: Client): Asset[] {
    return (client.assets || []).map((a) => ({
        id: a.id,
        type: a.type,
        name: a.name || '',
        current_value: Number(a.current_value) || 0,
        currency: a.currency || 'RUB',
        yield_percent: a.yield_percent,
        start_date: a.start_date,
        end_date: a.end_date,
        risk_level: a.risk_level,
    }));
}

export function mapClientToFormState(client: Client): ClientCardFormState {
    const fp = client.family_profile || {};
    const { credits: _fpCredits, ...familyWithoutCredits } = fp;

    return {
        contacts: {
            first_name: client.first_name || '',
            last_name: client.last_name || '',
            middle_name: client.middle_name || '',
            phone: client.phone || '',
            email: client.email || '',
            birth_date: client.birth_date || '',
            gender: client.gender === 'female' ? 'female' : 'male',
            avg_monthly_income: Number(client.avg_monthly_income) || 0,
        },
        family: {
            ...defaultFamilyProfile(),
            ...familyWithoutCredits,
            children: [...(fp.children || [])],
            contacts: [...(fp.contacts || [])],
            family_obligations: [...(fp.family_obligations || [])],
            real_estate: [...(fp.real_estate || [])],
            spouse: fp.spouse ? { ...fp.spouse } : {},
        },
        credits: mapCreditsFromClient(client),
        assets: mapAssetsFromClient(client),
    };
}

export function mapCreditsForApi(credits: ClientCardCreditRow[]): ClientCardCreditRow[] {
    return credits.map((c) => ({
        type: c.type,
        balance: Number(c.balance) || 0,
        monthlyPayment: Number(c.monthlyPayment) || 0,
        rate: Number(c.rate) || 0,
        name: c.name || CREDIT_TYPE_NAMES[c.type] || 'Кредит',
    }));
}

export function mapAssetsForApi(assets: Asset[]): Array<Record<string, unknown>> {
    const today = new Date().toISOString().split('T')[0];
    return assets.map((a) => ({
        ...(a.id != null ? { id: a.id } : {}),
        type: a.type,
        name: a.name || a.type,
        current_value: Number(a.current_value) || 0,
        currency: a.currency || 'RUB',
        start_date: a.start_date || today,
        risk_level: a.risk_level || 'conservative',
    }));
}

function familyProfileForApi(family: FamilyProfile): FamilyProfile {
    const { credits: _c, ...rest } = family;
    return rest;
}

function contactsPatch(form: ClientCardContactsForm): Record<string, unknown> {
    const patch: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        middle_name: form.middle_name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        birth_date: form.birth_date || undefined,
        gender: form.gender,
        avg_monthly_income: form.avg_monthly_income,
    };
    return patch;
}

function stableJson(value: unknown): string {
    return JSON.stringify(value);
}

export function getDirtySections(
    baseline: ClientCardFormState,
    current: ClientCardFormState,
): Set<ClientCardDirtySection> {
    const dirty = new Set<ClientCardDirtySection>();
    if (stableJson(baseline.contacts) !== stableJson(current.contacts)) {
        dirty.add('contacts');
    }
    if (stableJson(baseline.family) !== stableJson(current.family)) {
        dirty.add('family');
    }
    if (stableJson(baseline.credits) !== stableJson(current.credits)) {
        dirty.add('credits');
    }
    if (stableJson(baseline.assets) !== stableJson(current.assets)) {
        dirty.add('assets');
    }
    return dirty;
}

export function buildPatchBody(
    dirty: Set<ClientCardDirtySection>,
    form: ClientCardFormState,
): AgentClientPatchBody | null {
    if (dirty.size === 0) return null;

    const body: AgentClientPatchBody = {};

    if (dirty.has('contacts') || dirty.has('family')) {
        const client: Record<string, unknown> = {};
        if (dirty.has('contacts')) {
            Object.assign(client, contactsPatch(form.contacts));
        }
        if (dirty.has('family')) {
            client.family_profile = familyProfileForApi(form.family);
        }
        body.client = client;
    }

    if (dirty.has('credits')) {
        body.credits = mapCreditsForApi(form.credits);
    }

    if (dirty.has('assets')) {
        body.assets = mapAssetsForApi(form.assets);
    }

    return body;
}

export function applyClientToFormState(client: Client): ClientCardFormState {
    return mapClientToFormState(client);
}

export const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
    { value: 'CASH', label: 'Наличные' },
    { value: 'DEPOSIT', label: 'Депозит' },
    { value: 'BROKERAGE', label: 'Брокерский счёт' },
    { value: 'IIS', label: 'ИИС' },
    { value: 'PDS', label: 'ПДС' },
    { value: 'NSJ', label: 'НСЖ' },
    { value: 'REAL_ESTATE', label: 'Недвижимость (расчёт)' },
    { value: 'CRYPTO', label: 'Криптовалюта' },
    { value: 'OTHER', label: 'Другое' },
];

export function formatMoneyInput(value: number): string {
    if (!value) return '';
    return new Intl.NumberFormat('ru-RU').format(value);
}

export function parseMoneyInput(raw: string): number {
    const digits = raw.replace(/\D/g, '');
    return digits ? Number(digits) : 0;
}

export function getClientCardErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') return 'Не удалось выполнить запрос';
    const ax = error as {
        response?: { status?: number; data?: { message?: string; error?: string; details?: unknown } };
        message?: string;
    };
    const status = ax.response?.status;
    const data = ax.response?.data;
    if (status === 403) return 'Нет прав на редактирование этого клиента';
    if (status === 404) return 'Клиент не найден';
    if (status === 400) {
        if (typeof data?.message === 'string') return data.message;
        if (typeof data?.error === 'string') return data.error;
        return 'Ошибка валидации данных';
    }
    if (typeof data?.message === 'string') return data.message;
    if (typeof ax.message === 'string') return ax.message;
    return 'Не удалось выполнить запрос';
}
