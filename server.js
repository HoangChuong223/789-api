const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;
app.use(cors());

let currentData = {
    id: "binhtool90",        // chủ sở hữu
    id_phien: null,
    xucxac: "",
    ket_qua: ""
};

// Serve kết quả ra localhost
app.get("/", (req, res) => {
    res.json(currentData);
});
app.listen(PORT, () => {
    console.log(`🌐 Đang chạy server tại http://localhost:${PORT}`);
});

function connectWebSocket() {
    const ws = new WebSocket("wss://websocket.atpman.net/websocket");

    ws.on("open", () => {
        console.log("✅ Đã kết nối tới WebSocket 789");

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

        const register = [
            [6, "MiniGame", "taixiuUnbalancedPlugin", { cmd: 2000 }],
            [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }]
        ];

        ws.send(JSON.stringify(login));
        register.forEach(msg => ws.send(JSON.stringify(msg)));
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

                console.log(`🆕 Phiên: ${sid} | Xúc xắc: ${d1}-${d2}-${d3} | Tổng: ${tong} => ${ket_qua}`);
            }
        } catch (e) {
            console.log("❌ Lỗi xử lý tin nhắn:", e.message);
        }
    });

    ws.on("close", () => {
        console.log("🔌 Mất kết nối! Thử reconnect sau 5s...");
        setTimeout(connectWebSocket, 1000);
    });

    ws.on("error", (err) => {
        console.log("❌ Lỗi WebSocket:", err.message);
    });
}

connectWebSocket();
