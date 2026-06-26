// Bridge shim for the FooterMenuPackage's `t()` translation helper.
// Backs it with the SDK's i18n. Falls back to the raw key if the message is
// missing so the UI never renders blank.
import { stateI18nDerived } from 'state-shared';

export function t(key: string): string {
	try {
		return stateI18nDerived.translate(key) || key;
	} catch {
		return key;
	}
}
