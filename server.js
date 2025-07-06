// server.js
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
  res.send('<h2>📢 Tool WebSocket Tài Xỉu - ID: <b>binhtool90</b></h2>');
});

app.listen(PORT, () => {
  console.log(`🌐 Server đang chạy tại http://localhost:${PORT}`);
});

const WS_URL = 'wss://websocket.atpman.net/websocket';
let ws;

const HEADERS = {
  "Host": "websocket.atpman.net",
  "Origin": "https://play.789club.sx",
  "User-Agent": "Mozilla/5.0",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "vi-VN,vi;q=0.9",
  "Pragma": "no-cache",
  "Cache-Control": "no-cache"
};

const LOGIN_MESSAGE = [
  1,
  "MiniGame",
  "apitx789",
  "binhtool90",
  {
    info: JSON.stringify({
      ipAddress: "2a09:bac5:d44b:16d2::246:d4",
      userId: "6af5b295-bae8-4c69-8386-afeaafd4101b",
      username: "S8_apitx789",
      timestamp: 1751786319973,
      refreshToken: "6947ef5011a14921b42c70a57239b279.ba8aef3c9b094ec9961dc9c5def594cf"
    }),
    signature: "47D64C1BB382E32AD40837624A640609370AAD1D67B5B1B51FDE6BB205DD5AB1..."
  }
];

const SUBSCRIBE_TX_RESULT = [6, "MiniGame", "taixiuUnbalancedPlugin", { cmd: 2000 }];
const SUBSCRIBE_LOBBY = [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }];

function connectWS() {
  ws = new WebSocket(WS_URL, null, { headers: HEADERS });

  ws.on('open', () => {
    console.log('✅ Đã kết nối WebSocket 789');
    ws.send(JSON.stringify(LOGIN_MESSAGE));
    setTimeout(() => {
      ws.send(JSON.stringify(SUBSCRIBE_TX_RESULT));
      ws.send(JSON.stringify(SUBSCRIBE_LOBBY));
    }, 1000);

    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("2");
      }
    }, 10000);
  });

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (Array.isArray(data) && data[1] && data[1].cmd === 2006) {
        const { sid, d1, d2, d3 } = data[1];
        const total = d1 + d2 + d3;
        const result = total >= 11 ? 'Tài' : 'Xỉu';
        console.log(`🎲 Phiên ${sid}: ${d1}-${d2}-${d3} | Tổng ${total} ⇒ ${result}`);
      }
    } catch (e) {
      // ignore non-JSON messages
    }
  });

  ws.on('close', () => {
    console.log('🔌 Mất kết nối! Đang thử lại sau 5s...');
    setTimeout(connectWS, 5000);
  });

  ws.on('error', (err) => {
    console.log('❌ Lỗi WebSocket:', err.message);
  });
}

connectWS();
