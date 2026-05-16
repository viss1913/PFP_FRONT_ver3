import type { FamilyOfficeInviteRequest } from '../api/agentLkApi';
import type { Client } from '../types/client';
import { PHONE_MASK_TEMPLATE, formatRussianPhoneInput } from './phone';

export function clientToFamilyOfficeInvitePrefill(
    client: Client,
): Partial<FamilyOfficeInviteRequest> {
    const phone = client.phone
        ? formatRussianPhoneInput(client.phone)
        : PHONE_MASK_TEMPLATE;

    return {
        email: client.email ?? '',
        first_name: client.first_name ?? '',
        last_name: client.last_name ?? '',
        phone,
        birth_date: client.birth_date,
        gender: client.gender,
        source_note: client.id ? `Клиент CRM #${client.id}` : undefined,
    };
}
