import React from "react";
import "./HeaderModal.css"; // reuse same styling

const UDPHeaderModal = ({ hex }) => {
    const hexToBytes = (hex) => {
        const bytes = [];
        for (let c = 0; c < hex.length; c += 2) {
            bytes.push(parseInt(hex.substr(c, 2), 16));
        }
        return new Uint8Array(bytes);
    };

    const buffer = hexToBytes(hex);

    const srcPort = (buffer[0] << 8) | buffer[1];
    const dstPort = (buffer[2] << 8) | buffer[3];
    const length = (buffer[4] << 8) | buffer[5];
    const checksum = (buffer[6] << 8) | buffer[7];

    return (
        <div className="header-modal">
            <h2>📦 UDP Header (IETF Style)</h2>
            <div className="header-table">
                <div className="row">
                    <div className="cell medium">Source Port: {srcPort}</div>
                    <div className="cell medium">Destination Port: {dstPort}</div>
                </div>
                <div className="row">
                    <div className="cell medium">Length: {length}</div>
                    <div className="cell medium">Checksum: 0x{checksum.toString(16)}</div>
                </div>
            </div>
        </div>
    );
};

export default UDPHeaderModal;
