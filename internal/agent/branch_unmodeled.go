package agent

import (
	"bytes"
	"encoding/json"
	"reflect"
	"sort"
	"strings"
)

// branchMetaKnownJSONFields lists every JSON key this struct emits. Ownership
// is decided by the tags, not by what the current value happened to serialize,
// so an omitempty zero value still counts as a field this build owns.
var branchMetaKnownJSONFields = func() map[string]struct{} {
	out := map[string]struct{}{}
	t := reflect.TypeOf(BranchMeta{})
	for i := 0; i < t.NumField(); i++ {
		tag := t.Field(i).Tag.Get("json")
		name, _, _ := strings.Cut(tag, ",")
		if name == "" || name == "-" {
			continue
		}
		out[name] = struct{}{}
	}
	return out
}()

// retiredBranchMetaJSONFields are keys earlier builds wrote and this one drops
// on purpose: keeping them would imply a setting this build no longer offers.
var retiredBranchMetaJSONFields = map[string]struct{}{
	"recovery_checkpoint_enabled": {},
}

// preserveUnmodeledBranchMetaFields re-attaches sidecar keys this build does
// not model before the closing brace, keeping field order intact. ok is false
// when the merge is unsafe (undecodable input, unexpected shape).
func preserveUnmodeledBranchMetaFields(encoded, previous []byte) ([]byte, bool) {
	if len(previous) == 0 || len(encoded) == 0 {
		return nil, false
	}
	var previousFields map[string]json.RawMessage
	if err := json.Unmarshal(previous, &previousFields); err != nil {
		return nil, false
	}
	unknown := make([]string, 0, len(previousFields))
	for key := range previousFields {
		if _, known := branchMetaKnownJSONFields[key]; known {
			continue
		}
		if _, retired := retiredBranchMetaJSONFields[key]; retired {
			continue
		}
		unknown = append(unknown, key)
	}
	if len(unknown) == 0 {
		return nil, false
	}
	sort.Strings(unknown)
	trimmed := bytes.TrimRight(encoded, "\n")
	if len(trimmed) < 2 || trimmed[len(trimmed)-1] != '}' {
		return nil, false
	}
	body := bytes.TrimRight(trimmed[:len(trimmed)-1], " \t\r\n")
	empty := len(body) > 0 && body[len(body)-1] == '{'
	var buf bytes.Buffer
	buf.Write(body)
	for i, key := range unknown {
		keyJSON, err := json.Marshal(key)
		if err != nil {
			return nil, false
		}
		if i > 0 || !empty {
			buf.WriteByte(',')
		}
		buf.WriteString("\n  ")
		buf.Write(keyJSON)
		buf.WriteString(": ")
		buf.Write(previousFields[key])
	}
	buf.WriteString("\n}\n")
	return buf.Bytes(), true
}
