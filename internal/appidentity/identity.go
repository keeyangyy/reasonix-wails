package appidentity

const (
	// AppUserModelID is shared by every process, shortcut and toast that
	// users perceive as Reasonix Wails. Keep it version-independent across
	// upgrades. It is intentionally distinct from upstream Reasonix
	// ("Reasonix") so both installations can live in separate taskbar groups.
	AppUserModelID = "Reasonix.Wails"

	// legacyTauriAppUserModelID was written to Windows shortcuts by Reasonix
	// Desktop 0.53. Keep the current identity distinct so separately installed
	// Tauri and Wails generations do not merge into one taskbar group.
	legacyTauriAppUserModelID = "dev.reasonix.desktop"

	// legacyWailsAppUserModelID was used by the pre-independence Wails build
	// that shared the upstream "Reasonix" identity. Kept for migration code
	// that needs to recognise (not adopt) shortcuts from that generation.
	legacyWailsAppUserModelID = "Reasonix"
)
