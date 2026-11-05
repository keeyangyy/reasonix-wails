package main

import "strings"

// saveProviderCredential persists a provider key. The remote credential proxy
// was removed with the SSH workspace, so this now only writes the env entry.
func (a *App) saveProviderCredential(apiKeyEnv, value string) (string, error) {
	apiKeyEnv = strings.TrimSpace(apiKeyEnv)
	value = strings.TrimSpace(value)
	if err := upsertDotEnv(apiKeyEnv, value); err != nil {
		return "", err
	}
	return providerCredentialSourceNotice(apiKeyEnv, value), nil
}
