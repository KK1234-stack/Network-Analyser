// TCPHeaderModal.js
import React from "react";
import "./HeaderModal.css"; // reuse same CSS

const TCPHeaderModal = ({ hex }) => {
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
    const seqNumber = (buffer[4] << 24) | (buffer[5] << 16) | (buffer[6] << 8) | buffer[7];
    const ackNumber = (buffer[8] << 24) | (buffer[9] << 16) | (buffer[10] << 8) | buffer[11];
    const dataOffset = (buffer[12] >> 4) * 4;
    const flags = buffer[13];
    const window = (buffer[14] << 8) | buffer[15];
    const checksum = (buffer[16] << 8) | buffer[17];
    const urgent = (buffer[18] << 8) | buffer[19];

    return (
        <div className="header-modal">
            <h2>🔍 TCP Header (IETF Style)</h2>
            <div className="header-table">
                <div className="row">
                    <div className="cell large">Source Port: {srcPort}</div>
                    <div className="cell large">Destination Port: {dstPort}</div>
                </div>
                <div className="row">
                    <div className="cell full">Sequence Number: {seqNumber}</div>
                </div>
                <div className="row">
                    <div className="cell full">Acknowledgment Number: {ackNumber}</div>
                </div>
                <div className="row">
                    <div className="cell small">Data Offset: {dataOffset} bytes</div>
                    <div className="cell small">Flags: 0x{flags.toString(16)}</div>
                    <div className="cell medium">Window: {window}</div>
                </div>
                <div className="row">
                    <div className="cell medium">Checksum: 0x{checksum.toString(16)}</div>
                    <div className="cell medium">Urgent Pointer: {urgent}</div>
                </div>
            </div>
        </div>
    );
};

export default TCPHeaderModal;
