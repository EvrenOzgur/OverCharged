// Bridge shim for the FooterMenuPackage's `rgsState`.
// Only `isMockMode` is consumed by the package menus. OverCharged runs against
// the live RGS, so this is false. Kept as a getter for API-compatibility.
class RgsStateBridge {
	get isMockMode() {
		return false;
	}
}

export const rgsState = new RgsStateBridge();
