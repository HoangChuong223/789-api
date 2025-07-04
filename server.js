const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

let currentData = {
  id: "binhtool90",
  id_phien: null,
  ket_qua: null
};

// Hàm xử lý tin nhắn từ WebSocket
function handleMessage(message) {
  try {
    const data = JSON.parse(message);

    if (Array.isArray(data) && data.length >= 2 && typeof data[1] === 'object') {
      const payload = data[1];
      const cmd = payload.cmd;

      if (cmd === 2007) {
        const sid = payload.sid;
        if (sid && sid !== currentData.id_phien) {
          currentData.id_phien = sid;
          console.log(`🆕 Phiên mới: ${sid}`);
        }
      }

      if (cmd === 1003 || ('d1' in payload && 'd2' in payload && 'd3' in payload)) {
        const { d1, d2, d3 } = payload;
        if (d1 !== undefined && d2 !== undefined && d3 !== undefined) {
          const total = d1 + d2 + d3;
          const outcome = total > 10 ? "Tai" : "Xiu";
          currentData.ket_qua = `${d1}-${d2}-${d3} = ${total} (${outcome})`;
          console.log(`🎲 ${currentData.ket_qua}`);
        }
      }
    }
  } catch (err) {
    console.log("❌ JSON parse error", err);
  }
}

// Kết nối WebSocket
function connectWebSocket() {
  const ws = new WebSocket("wss://websocket.atpman.net/websocket", {
    headers: {
      "Host": "websocket.atpman.net",
      "Origin": "https://789club.sx",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  });

  ws.on('open', () => {
    console.log("✅ Đã kết nối WebSocket");

    const messages_to_send = [
      [1, "MiniGame", "saoban", "ere2234", {
        "info": "{\"ipAddress\":\"125.235.239.187\",\"userId\":\"2ef4335a-6562-4c64-b012-46ef83a25800\",\"username\":\"S8_saoban\",\"timestamp\":1749643344994,\"refreshToken\":\"e790adfa529e42639552261c7a7d206b.51b6327dccb94fe1b4a96040d5ded732\"}",
        "signature": "20399D67A1EC9E78B287200DE26F206FFEBB01C545C52EDAC0F0C347CF26A7900FB5AD74BC2DC9A35634C0E9F45BF799B3D8696052D5392CFB9BE0F4CF086BE8F50699C542C7693722B4EE68ECDCF72EB887B91A46FC662087E233EE7C10FED14505920B6687F5B9E30B4FF6EACBF1305FDB9A5DC4ED010DBA3C3AB3DAE5AC14"
      }],
      [6, "MiniGame", "taixiuUnbalancedPlugin", {"cmd": 2000}]
    ];

    for (const msg of messages_to_send) {
      ws.send(JSON.stringify(msg));
    }
  });

  ws.on('message', handleMessage);

  ws.on('error', err => {
    console.error("❌ Lỗi WebSocket:", err);
  });

  ws.on('close', () => {
    console.log("🔌 Mất kết nối WebSocket. Đang thử lại sau 5s...");
    setTimeout(connectWebSocket, 1000);
  });
}

// API endpoint trả JSON dữ liệu hiện tại
app.get('/data', (req, res) => {
  res.json(currentData);
});

app.listen(PORT, () => {
  console.log(`🚀 Server REST đang chạy tại http://localhost:${PORT}/data`);
  connectWebSocket();
});
