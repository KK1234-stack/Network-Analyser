import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#00ff99", "#3399ff", "#ff3366"];

// WebSocket setup
const socket = io("ws://localhost:3001", {
  transports: ["websocket"],
});

// 🔍 Mapping ports to common application layer protocols
const getAppProtocol = (pkt) => {
  const port = pkt.transport?.dstPort || pkt.transport?.srcPort;
  const appMap = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    123: "NTP",
    143: "IMAP",
    443: "HTTPS",
  };
  return appMap[port] || "";
};




function App() {
  const [interfaces, setInterfaces] = useState([]);
  const [selected, setSelected] = useState("");
  const [sniffing, setSniffing] = useState(false);
  const [packets, setPackets] = useState([]);
  const [packetStats, setPacketStats] = useState([]);
  const packetBufferRef = useRef([]);

  useEffect(() => {
    socket.on("interfaces", (data) => {
      console.log("💡 Received interfaces:", data);
      setInterfaces(data);
    });

    socket.on("packet", (data) => {
      packetBufferRef.current.push(data);
    });

    socket.on("packet-count", (data) => {
      const formattedTime = new Date(data.timestamp).toLocaleTimeString();
      setPacketStats((prev) => [
        ...prev.slice(-19),
        { time: formattedTime, count: data.count },
      ]);
    });

    const interval = setInterval(() => {
      if (packetBufferRef.current.length > 0) {
        setPackets((prev) => [
          ...packetBufferRef.current.reverse().slice(0, 5),
          ...prev,
        ].slice(0, 5));
        packetBufferRef.current = [];
      }
    }, 500);

    return () => {
      socket.off("interfaces");
      socket.off("packet");
      socket.off("packet-count");
      clearInterval(interval);
    };
  }, []);

  const startSniffing = () => {
    if (!selected) return alert("Please select an interface first.");
    socket.emit("start-sniffing", selected);
    setSniffing(true);
  };

  const stopSniffing = () => {
    socket.emit("stop-sniffing");
    setSniffing(false);
  };


  const getTransportStats = () => {
    const stats = { TCP: 0, UDP: 0, Other: 0 };
    packets.forEach((pkt) => {
      const proto = pkt.transport?.type;
      if (proto === "TCP") stats.TCP++;
      else if (proto === "UDP") stats.UDP++;
      else stats.Other++;
    });
    return [
      { name: "TCP", value: stats.TCP },
      { name: "UDP", value: stats.UDP },
      { name: "Other", value: stats.Other },
    ];
  };
  const getAppStats = () => {
    const appCount = {};
    packets.forEach((pkt) => {
      const proto = getAppProtocol(pkt) || "Unknown";
      appCount[proto] = (appCount[proto] || 0) + 1;
    });

    return Object.entries(appCount).map(([name, value]) => ({
      name,
      value,
    }));
  };



  return (
    <div className="App">
      <h1>🌐 Network Packet Sniffer</h1>

      <label>
        Interface:&nbsp;
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">-- Select --</option>
          {interfaces.map((iface, i) => (
            <option key={i} value={iface.name}>
              {iface.name}
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: "10px" }}>
        <button onClick={startSniffing} disabled={sniffing || !selected}>
          ▶️ Start
        </button>
        <button onClick={stopSniffing} disabled={!sniffing}>
          ⏹ Stop
        </button>
      </div>

      <hr />

      <div className="main-content">
        {/* LEFT PANEL */}
        <div className="packet-list">
          <h2>📦 Latest Packets</h2>
          <ul>
            {packets.map((pkt, i) => (
              <li key={i}>
                <strong>
                  {pkt.ipv4?.src ?? "?"} → {pkt.ipv4?.dst ?? "?"}
                </strong>{" "}
                ({pkt.transport?.type ?? "?"} {pkt.transport?.srcPort ?? "-"} →{" "}
                {pkt.transport?.dstPort ?? "-"})
                <br />
                <small>
                  MAC: {pkt.ethernet?.src ?? "?"} → {pkt.ethernet?.dst ?? "?"}
                </small>
                <br />
                <small>
                  App Protocol:{" "}
                  <strong>{getAppProtocol(pkt) || "Unknown"}</strong>
                </small>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT PANEL */}
        <div className="packet-chart">
          <h2>📈 Packets Per Second</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={packetStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#00ff99"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <hr />

      {/* STATS  */}
      <div className="packet-chart" style={{ marginTop: "20px" }}>
        <h2>📊 Transport Layer Stats</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={getTransportStats()}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#0f0"
              label
            >
              {getTransportStats().map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="main-content">
        <div className="packet-chart">
          <h2>📊 Transport Layer Stats</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getTransportStats()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {getTransportStats().map((entry, index) => (
                  <Cell key={`cell-transport-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="packet-chart">
          <h2>🧠 App Layer Protocols</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getAppStats()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {getAppStats().map((entry, index) => (
                  <Cell key={`cell-app-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>



      <footer
        style={{
          marginTop: "40px",
          textAlign: "center",
          color: "#0f0",
          fontSize: "14px",
        }}
      >
        Made with <span style={{ color: "red" }}>❤️</span> by KK
      </footer>
    </div>
  );

}

export default App;
