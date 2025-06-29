// MACHeaderModal.js
import React from "react";
import "./HeaderModal.css";

const MACHeaderModal = ({ hex }) => {
    const hexToBytes = (hex) => {
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return new Uint8Array(bytes);
    };

    const buffer = hexToBytes(hex);
    const dstMAC = buffer.slice(0, 6).map(b => b.toString(16).padStart(2, '0')).join(":");
    const srcMAC = buffer.slice(6, 12).map(b => b.toString(16).padStart(2, '0')).join(":");
    const ethType = "0x" + buffer.slice(12, 14).map(b => b.toString(16).padStart(2, '0')).join("");

    return (
        <div className="header-modal">
            <h2>📶 MAC Frame Header (Ethernet II)</h2>
            <div className="header-table">
                <div className="row">
                    <div className="cell full">Destination MAC: {dstMAC}</div>
                </div>
                <div className="row">
                    <div className="cell full">Source MAC: {srcMAC}</div>
                </div>
                <div className="row">
                    <div className="cell full">EtherType: {ethType}</div>
                </div>
            </div>
        </div>
    );
};

export default MACHeaderModal;
