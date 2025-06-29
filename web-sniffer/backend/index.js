// backend/index.js
const Cap = require("cap").Cap;
let packetCount = 0;

const decoders = require("cap").decoders;
const PROTOCOL = decoders.PROTOCOL;
const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer();
const io = socketIo(server, {
    cors: {
        origin: "*", // for local dev only
    },
});

server.listen(3001, () => {
    console.log("WebSocket server running on port 3001");
});
setInterval(() => {
    io.emit("packet-count", { timestamp: Date.now(), count: packetCount });
    packetCount = 0; // reset for the next second
}, 1000);


// List available interfaces
const deviceList = Cap.deviceList();
const interfaces = deviceList.map((d) => ({
    name: d.name,
    description: d.description || d.name,
}));


// Track capture state per socket
io.on("connection", (socket) => {
    console.log("🟢 Client connected");
    socket.emit("interfaces", interfaces);

    let cap;
    let buffer = Buffer.alloc(65535);
    let linkType;

    socket.on("start-sniffing", (iface) => {
        if (cap) return;

        console.log(`⚡ Starting capture on: ${iface}`);
        cap = new Cap();
        linkType = cap.open(iface, "ip", 10 * 1024 * 1024, buffer);

        cap.on("packet", function (nbytes, trunc) {
            packetCount++;
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

                    const ipHeader = buffer.slice(eth.offset, eth.offset + ip.hdrlen);
                    packetData.rawIPHeaderHex = ipHeader.toString("hex");

                    if (ip.info.protocol === PROTOCOL.IP.TCP) {
                        const tcp = decoders.TCP(buffer, ip.offset);
                        packetData.transport = {
                            type: "TCP",
                            srcPort: tcp.info.srcport,
                            dstPort: tcp.info.dstport,
                        };

                        // Extract TCP header safely
                        const tcpHeaderLength = (buffer[ip.offset + 12] >> 4) * 4;
                        const tcpHeader = buffer.slice(ip.offset, ip.offset + tcpHeaderLength);
                        packetData.rawTCPHeaderHex = tcpHeader.toString("hex");

                    } else if (ip.info.protocol === PROTOCOL.IP.UDP) {
                        const udp = decoders.UDP(buffer, ip.offset);
                        packetData.transport = {
                            type: "UDP",
                            srcPort: udp.info.srcport,
                            dstPort: udp.info.dstport,
                        };

                        // UDP header is always 8 bytes
                        const udpHeader = buffer.slice(ip.offset, ip.offset + 8);
                        packetData.rawUDPHeaderHex = udpHeader.toString("hex");
                    }

                }
            }


            socket.emit("packet", packetData);
        });
    });

    socket.on("stop-sniffing", () => {
        if (cap) {
            console.log("⛔ Stopping capture.");
            cap.close();
            cap = null;
        }
    });

    socket.on("disconnect", () => {
        console.log("🔴 Client disconnected");
        if (cap) {
            cap.close();
            cap = null;
        }
    });
});
