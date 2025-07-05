const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const WS_URL = "wss://websocket.atpman.net/websocket";

// === Tạo WebSocket Key random ===
const generateWSKey = () => crypto.randomBytes(16).toString("base64");

// === Dữ liệu bot
const LOGIN_MESSAGE = [
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
        signature: "2F796D8C4B47504CAE239FDD76768AE7335628E05F5FBF9BF3B4476D3F2A0CAA84EA1F47A164CD7623D19A04C12A950F83C0680C05994B07BA75BAE31D6C4356A05A66E6AA6A607C12C155A2FD411CE4BA7A558FCA3A692ECAF6018B83BEE10D035CCB7F51E9DFD7C12AB618C5E1EDD28329705D0BCDC6A17B596C37EF43F821" // rút gọn
    }
];

const REGISTER_MESSAGES = [
    [6, "MiniGame", "taixiuUnbalancedPlugin", { cmd: 2000 }],
    [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }]
];

let currentData = {
    id: "binhtool90",
    id_phien: null,
    xucxac: "",
    ket_qua: ""
};

let pingInterval;
let lastPong = Date.now();
let firstConnection = true;

// === Kết nối WebSocket với đầy đủ header ===
function connectWebSocket() {
    const secWebSocketKey = generateWSKey();

    const ws = new WebSocket(WS_URL, {
        headers: {
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "Cache-Control": "no-cache",
            "Connection": "Upgrade",
            "Host": "websocket.atpman.net",
            "Origin": "https://play.789club.sx",
            "Pragma": "no-cache",
            "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
            "Sec-WebSocket-Key": secWebSocketKey,
            "Sec-WebSocket-Version": "13",
            "Upgrade": "websocket",
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36"
        }
    });

    ws.on("open", () => {
        console.log("✅ Đã kết nối WebSocket 789");

        setTimeout(() => {
            ws.send(JSON.stringify(LOGIN_MESSAGE));
            console.log("📩 Đã gửi đăng nhập");

            if (firstConnection) {
                REGISTER_MESSAGES.forEach((msg, i) => {
                    setTimeout(() => {
                        ws.send(JSON.stringify(msg));
                        console.log("📩 Đăng ký nhận kết quả:", msg);
                    }, 200 + i * 300);
                });
                firstConnection = false;
            }
        }, Math.random() * 1000 + 1000);

        pingInterval = setInterval(() => {
            if (Date.now() - lastPong > 5000) {
                console.log("⚠️ Ping timeout > 5s, đóng kết nối");
                ws.terminate();
            } else {
                ws.ping();
            }
        }, 15000);
    });

    ws.on("pong", () => {
        lastPong = Date.now();
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

                console.log(`🆕 Phiên: ${sid} | Kết quả: ${d1}-${d2}-${d3} = ${tong} => ${ket_qua}`);
            }
        } catch (e) {
            console.log("❌ Lỗi xử lý tin nhắn:", e.message);
        }
    });

    ws.on("close", (code, reason) => {
        console.log("🔌 Kết nối bị đóng:", code, "-", reason);
        clearInterval(pingInterval);
        console.log("⏳ Đợi 5 giây rồi reconnect...");
        setTimeout(connectWebSocket, 5000);
    });

    ws.on("error", (err) => {
        console.log("❌ Lỗi WebSocket:", err.message);
    });
}

// === API Express
const app = express();
const PORT = 5000;
app.use(cors());

app.get("/", (req, res) => {
    res.json(currentData);
});

app.listen(PORT, () => {
    console.log(`🌐 API đang chạy tại: http://localhost:${PORT}`);
});

// === Khởi động WebSocket
connectWebSocket();
