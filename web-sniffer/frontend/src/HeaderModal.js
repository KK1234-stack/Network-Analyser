import React from "react";
import "./HeaderModal.css"; // Your existing styling

const HeaderModal = ({ hex, onClose }) => {
    // 🔧 Convert hex string to byte array
    const hexToBytes = (hex) => {
        const bytes = [];
        for (let c = 0; c < hex.length; c += 2) {
            bytes.push(parseInt(hex.substr(c, 2), 16));
        }
        return new Uint8Array(bytes);
    };

    const buffer = hexToBytes(hex);

    const version = (buffer[0] >> 4) & 0xf;
    const ihl = buffer[0] & 0xf;
    const tos = buffer[1];
    const totalLength = (buffer[2] << 8) | buffer[3];
    const identification = (buffer[4] << 8) | buffer[5];
    const flags = (buffer[6] >> 5) & 0x7;
    const fragmentOffset = ((buffer[6] & 0x1f) << 8) | buffer[7];
    const ttl = buffer[8];
    const protocol = buffer[9];
    const checksum = (buffer[10] << 8) | buffer[11];
    const srcIP = `${buffer[12]}.${buffer[13]}.${buffer[14]}.${buffer[15]}`;
    const dstIP = `${buffer[16]}.${buffer[17]}.${buffer[18]}.${buffer[19]}`;

    return (
        <div className="header-modal">
            <h2>🧾 IPv4 Header (IETF Style)</h2>

            <div className="header-table">
                <div className="row">
                    <div className="cell small">Version: {version}</div>
                    <div className="cell small">IHL: {ihl * 4} bytes</div>
                    <div className="cell medium">DSCP: {tos >> 2}</div>
                    <div className="cell tiny">ECN: {tos & 0x03}</div>
                    <div className="cell large">Total Length: {totalLength}</div>
                </div>

                <div className="row">
                    <div className="cell large">Identification: {identification}</div>
                    <div className="cell small">Flags: {flags}</div>
                    <div className="cell large">Fragment Offset: {fragmentOffset}</div>
                </div>

                <div className="row">
                    <div className="cell small">TTL: {ttl}</div>
                    <div className="cell small">Protocol: {protocol}</div>
                    <div className="cell large">Header Checksum: 0x{checksum.toString(16)}</div>
                </div>

                <div className="row">
                    <div className="cell full">Source IP: {srcIP}</div>
                </div>

                <div className="row">
                    <div className="cell full">Destination IP: {dstIP}</div>
                </div>
            </div>

            <button onClick={onClose} style={{ marginTop: "15px" }}>
                Close
            </button>
        </div>
    );

};

export default HeaderModal;
