// Bridge shim for the FooterMenuPackage's `s()` helper.
// In the source game `s(realText, socialText)` swaps wording for social-casino
// builds. OverCharged is a real-money build, so we always return the first
// variant. Centralised here so a future social build only edits one place.
export function s(realText: string, _socialText?: string): string {
	return realText;
}
