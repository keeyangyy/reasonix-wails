package productdocs

import (
	"encoding/binary"
	"hash"
)

func writeDigestRecord(destination hash.Hash, name string, data []byte) {
	var size [8]byte
	binary.BigEndian.PutUint64(size[:], uint64(len(name)))
	_, _ = destination.Write(size[:])
	_, _ = destination.Write([]byte(name))
	binary.BigEndian.PutUint64(size[:], uint64(len(data)))
	_, _ = destination.Write(size[:])
	_, _ = destination.Write(data)
}
