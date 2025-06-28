// backend/index.js
const Cap = require("cap").Cap;
const decoders = require("cap").decoders;
const PROTOCOL = decoders.PROTOCOL;
const os = require("os");
const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer();
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all for now; restrict in production
    },
});

server.listen(3001, () => {
    console.log("WebSocket server running on port 3001");
});

const cap = new Cap();
const deviceList = Cap.deviceList();
const device = deviceList.find((d) => !d.name.includes("lo"));
const filter = "ip";
const bufSize = 10 * 1024 * 1024;
const buffer = Buffer.alloc(65535);

if (!device) {
    console.log("No valid network interface found.");
    process.exit(1);
}

const linkType = cap.open(device.name, filter, bufSize, buffer);
console.log("Sniffing on device:", device.name);

cap.on("packet", function (nbytes, trunc) {
    const packetData = {
        ethernet: {},
        ipv4: null,
        transport: null,
    };

    if (linkType === "ETHERNET") {
        const eth = decoders.Ethernet(buffer);
        packetData.ethernet = {
            src: eth.info.srcmac,
            dst: eth.info.dstmac,
        };

        if (eth.info.type === PROTOCOL.ETHERNET.IPV4) {
            const ip = decoders.IPV4(buffer, eth.offset);
            packetData.ipv4 = {
                src: ip.info.srcaddr,
                dst: ip.info.dstaddr,
                protocol: ip.info.protocol,
            };

            if (ip.info.protocol === PROTOCOL.IP.TCP) {
                const tcp = decoders.TCP(buffer, ip.offset);
                packetData.transport = {
                    type: "TCP",
                    srcPort: tcp.info.srcport,
                    dstPort: tcp.info.dstport,
                };
            }

            if (ip.info.protocol === PROTOCOL.IP.UDP) {
                const udp = decoders.UDP(buffer, ip.offset);
                packetData.transport = {
                    type: "UDP",
                    srcPort: udp.info.srcport,
                    dstPort: udp.info.dstport,
                };
            }
        }
    }

    // Emit to all connected clients
    io.emit("packet", packetData);
});
