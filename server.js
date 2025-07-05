const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const WS_URL = "wss://websocket.atpman.net/websocket";

// Tạo key giống browser thật
const generateWSKey = () => crypto.randomBytes(16).toString("base64");

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
        signature: "" // rút gọn
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

let checkInterval;
let lastMessageTime = Date.now(); // dùng để theo dõi hoạt động

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
            "User-Agent": "Mozilla/5.0" 
    });

    ws.on("open", () => {
        console.log("✅ Đã kết nối WebSocket 789");

        setTimeout(() => {
            ws.send(JSON.stringify(LOGIN_MESSAGE));
            console.log("📩 Đã gửi đăng nhập");

            REGISTER_MESSAGES.forEach((msg, i) => {
                setTimeout(() => {
                    ws.send(JSON.stringify(msg));
                    console.log("📩 Đăng ký nhận kết quả:", msg);
                }, 300 * (i + 1));
            });
        }, 1000 + Math.random() * 1000); // delay như người

        // Gửi cmd:10001 định kỳ giữ kết nối
        setInterval(() => {
            ws.send(JSON.stringify([6, "MiniGame", "lobbyPlugin", { cmd: 10001 }]));
        }, 10000 + Math.random() * 10000); // 10-20s

        // Theo dõi kết nối còn sống
        checkInterval = setInterval(() => {
            if (Date.now() - lastMessageTime > 20000) {
                console.log("⚠️ Không nhận dữ liệu > 20s, đóng kết nối");
                ws.terminate(); // reconnect ở dưới
            }
        }, 10000);
    });

    ws.on("message", (data) => {
        lastMessageTime = Date.now(); // cập nhật mỗi lần có tin

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
        clearInterval(checkInterval);
        console.log("⏳ Đợi 5s rồi reconnect...");
        setTimeout(connectWebSocket, 5000);
    });

    ws.on("error", (err) => {
        console.log("❌ Lỗi WebSocket:", err.message);
    });
}

// === Express API để lấy dữ liệu mới nhất
const app = express();
const PORT = 8080;
app.use(cors());

app.get("/", (req, res) => {
    res.json(currentData);
});

app.listen(PORT, () => {
    console.log(`🌐 API đang chạy tại: http://localhost:${PORT}`);
});

// Start
connectWebSocket();
