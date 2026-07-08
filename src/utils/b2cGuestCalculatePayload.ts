import type { Asset } from '../types/client';

/** Тело POST /client/calculate для гостя (с ref + email → лид в CRM). */
export interface GuestCalculateAsset {
    type: string;
    current_value: number;
    unlock_month?: number;
    name?: string;
    currency?: string;
}

export interface GuestCalculatePayload {
    ref?: string;
    goals: Record<string, unknown>[];
    client: Record<string, unknown>;
    assets?: GuestCalculateAsset[];
}

export function mapAssetsForGuestCalculate(assets: Asset[]): GuestCalculateAsset[] {
    return assets.map((asset) => ({
        type: asset.type,
        current_value: asset.current_value,
        unlock_month: 0,
        ...(asset.name ? { name: asset.name } : {}),
        ...(asset.currency ? { currency: asset.currency } : {}),
    }));
}

function familyProfileForGuestCalculate(
    familyProfile: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
    if (!familyProfile) return undefined;

    const result: Record<string, unknown> = {};
    const maritalStatus = familyProfile.marital_status;
    if (typeof maritalStatus === 'string' && maritalStatus.trim()) {
        result.marital_status = maritalStatus;
    }
    if (Array.isArray(familyProfile.children) && familyProfile.children.length) {
        result.children = familyProfile.children;
    }
    if (Array.isArray(familyProfile.contacts) && familyProfile.contacts.length) {
        result.contacts = familyProfile.contacts;
    }
    if (familyProfile.spouse && typeof familyProfile.spouse === 'object') {
        result.spouse = familyProfile.spouse;
    }
    if (Array.isArray(familyProfile.family_obligations) && familyProfile.family_obligations.length) {
        result.family_obligations = familyProfile.family_obligations;
    }
    if (Array.isArray(familyProfile.real_estate) && familyProfile.real_estate.length) {
        result.real_estate = familyProfile.real_estate;
    }
    if (familyProfile.confidentiality && typeof familyProfile.confidentiality === 'object') {
        const confidentiality = familyProfile.confidentiality as Record<string, unknown>;
        result.confidentiality = {
            allow_spouse_access: Boolean(confidentiality.allow_spouse_access),
            allow_family_contact: Boolean(confidentiality.allow_family_contact),
            notes: confidentiality.notes || undefined,
        };
    }

    return Object.keys(result).length > 0 ? result : undefined;
}

export function buildGuestCalculatePayload(input: {
    ref?: string;
    goals: Record<string, unknown>[];
    birthDate: string;
    gender: 'male' | 'female';
    fio?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    phone?: string;
    email?: string;
    avgMonthlyIncome?: number;
    assets?: Asset[];
    totalLiquidCapital?: number;
    riskProfileAnswers?: Record<string, string>;
    riskQuestionnaireVersionId?: number;
    familyProfile?: Record<string, unknown>;
}): GuestCalculatePayload {
    const fio =
        (input.fio || '').trim() ||
        [input.firstName, input.lastName, input.middleName].filter(Boolean).join(' ').trim();

    const client: Record<string, unknown> = {
        birth_date: input.birthDate,
        sex: input.gender,
    };

    if (fio) client.fio = fio;
    const name = (input.firstName || '').trim() || fio.split(/\s+/)[0];
    if (name) client.name = name;
    if (input.phone?.trim()) client.phone = input.phone.trim();
    if (input.email?.trim()) client.email = input.email.trim();
    if (input.avgMonthlyIncome != null && input.avgMonthlyIncome > 0) {
        client.avg_monthly_income = input.avgMonthlyIncome;
    }
    if (input.riskProfileAnswers && input.riskQuestionnaireVersionId) {
        client.risk_profile_answers = input.riskProfileAnswers;
        client.risk_questionnaire_version_id = input.riskQuestionnaireVersionId;
    }

    const familyProfile = familyProfileForGuestCalculate(input.familyProfile);
    if (familyProfile) {
        client.family_profile = familyProfile;
    }

    const apiAssets = mapAssetsForGuestCalculate(input.assets || []);
    const totalLiquidCapital =
        input.totalLiquidCapital != null && input.totalLiquidCapital > 0
            ? input.totalLiquidCapital
            : apiAssets.reduce((sum, asset) => sum + (asset.current_value || 0), 0);

    if (totalLiquidCapital > 0) {
        client.total_liquid_capital = totalLiquidCapital;
    }
    if (apiAssets.length > 0) {
        client.assets = apiAssets;
    }

    const payload: GuestCalculatePayload = {
        goals: input.goals,
        client,
    };

    const ref = input.ref?.trim();
    if (ref) payload.ref = ref;
    if (apiAssets.length > 0) payload.assets = apiAssets;

    return payload;
}
