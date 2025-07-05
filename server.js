const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());

let currentData = {
    id: "binhtool90",
    id_phien: null,
    xucxac: "",
    ket_qua: ""
};

app.get("/", (req, res) => {
    res.json(currentData);
});

app.listen(PORT, () => {
    console.log(`🌐 Server chạy tại http://localhost:${PORT}`);
});

// Giữ Render luôn awake
setInterval(() => {
    https.get("https://seven89-api.onrender.com");
}, 30000); // mỗi 30s gửi HTTP để tránh sleep

let ws;
let pingInterval;
let cmdInterval;

function connectWebSocket() {
    ws = new WebSocket("wss://websocket.atpman.net/websocket", {
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Origin": "https://play.789club.sx"
        }
    });

    ws.on("open", () => {
        console.log("✅ Đã kết nối WebSocket 789");

        const login = [
            1,
            "MiniGame",
            "apitx789",
            "binhtool90",
            {
                info: JSON.stringify({
                    ipAddress: "2a09:bac1:7a80:10::3c1:3a",
                    userId: "6af5b295-bae8-4c69-8386-afeaafd4101b",
                    username: "S8_apitx789",
                    timestamp: 1751737271849,
                    refreshToken: "6947ef5011a14921b42c70a57239b279.ba8aef3c9b094ec9961dc9c5def594cf"
                }),
                signature: "2F796D8C4B47504CAE239FDD76768AE7335628E05F5FBF9BF3B4476D3F2A0CAA84EA1F47A164CD7623D19A04C12A950F83C0680C05994B07BA75BAE31D6C4356A05A66E6AA6A607C12C155A2FD411CE4BA7A558FCA3A692ECAF6018B83BEE10D035CCB7F51E9DFD7C12AB618C5E1EDD28329705D0BCDC6A17B596C37EF43F821"
            }
        ];

        const cmd2000 = [6, "MiniGame", "taixiuUnbalancedPlugin", { cmd: 2000 }];
        const cmd10001 = [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }];

        ws.send(JSON.stringify(login));
        ws.send(JSON.stringify(cmd2000));
        ws.send(JSON.stringify(cmd10001));
        console.log("📩 Đã gửi đăng nhập + đăng ký nhận kết quả");

        // Ping server mỗi 15s
        pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping("keep-alive");
                console.log("📤 Gửi ping...");
            }
        }, 15000);

        // Gửi lại cmd 2000 mỗi 60s để giữ alive
        cmdInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(cmd2000));
                console.log("♻️ Gửi lại cmd 2000");
            }
        }, 60000);
    });

    ws.on("pong", () => {
        console.log("📶 Nhận pong từ server");
    });

    ws.on("message", (data) => {
        try {
            const msg = JSON.parse(data);
            if (Array.isArray(msg) && msg[0] === 5 && msg[1]?.cmd === 2006) {
                const { sid, d1, d2, d3 } = msg[1];
                const tong = d1 + d2 + d3;
                const ket_qua = tong >= 11 ? "Tài" : "Xỉu";

                currentData = {
                    id: "binhtool90",
                    id_phien: sid,
                    xucxac: `${d1}-${d2}-${d3}`,
                    ket_qua: `${tong} => ${ket_qua}`
                };

                console.log(`🎲 Phiên ${sid} | Xúc xắc: ${d1}-${d2}-${d3} | Tổng ${tong} => ${ket_qua}`);
            }
        } catch (err) {
            console.log("❌ Lỗi JSON:", err.message);
        }
    });

    ws.on("close", (code, reason) => {
        console.log(`🔌 Kết nối bị đóng: ${code} - ${reason}`);
        clearInterval(pingInterval);
        clearInterval(cmdInterval);
        console.log("⏳ Đợi 5 giây rồi reconnect...");
        setTimeout(connectWebSocket, 5000);
    });

    ws.on("error", (err) => {
        console.log("❌ Lỗi WebSocket:", err.message);
    });
}

connectWebSocket();
