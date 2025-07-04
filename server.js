const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const PORT = 3000;

// === Biến toàn cục ===
let id_phien = null;
let wsClient = null;

// === Tin nhắn cần gửi ===
const messagesToSend = [
  [1, "MiniGame", "saoban", "ere2234", {
    info: "{\"ipAddress\":\"125.235.239.187\",\"userId\":\"2ef4335a-6562-4c64-b012-46ef83a25800\",\"username\":\"S8_saoban\",\"timestamp\":1749643344994,\"refreshToken\":\"e790adfa529e42639552261c7a7d206b.51b6327dccb94fe1b4a96040d5ded732\"}",
    signature: "20399D67A1EC9E78B287200DE26F206FFEBB01C545C52EDAC0F0C347CF26A7900FB5AD74BC2DC9A35634C0E9F45BF799B3D8696052D5392CFB9BE0F4CF086BE8F50699C542C7693722B4EE68ECDCF72EB887B91A46FC662087E233EE7C10FED14505920B6687F5B9E30B4FF6EACBF1305FDB9A5DC4ED010DBA3C3AB3DAE5AC14"
  }],
  [6, "MiniGame", "taixiuUnbalancedPlugin", { cmd: 2000 }],
];

// === Hàm kết nối lại nếu bị ngắt ===
function connectWebSocket() {
  const headers = {
    'Host': 'websocket.atpman.net',
    'Origin': 'https://789club.sx ',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
  };

  wsClient = new WebSocket('wss://websocket.atpman.net/websocket', {
    headers
  });

  // === Khi mở kết nối ===
  wsClient.on('open', () => {
    console.log('✅ Đã kết nối thành công đến WebSocket');
    messagesToSend.forEach((msg, index) => {
      setTimeout(() => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify(msg));
          console.log(`📤 Gửi tin nhắn ${index + 1}`);
        }
      }, index * 1000);
    });
  });

  // === Khi nhận dữ liệu ===
  wsClient.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (Array.isArray(message) && message.length >= 2 && typeof message[1] === 'object') {
        const payload = message[1];
        const cmd = payload.cmd;

        // Nhận session ID
        if (cmd === 2007) {
          id_phien = payload.sid;
          console.log(`🎮 Phiên mới: ${id_phien}`);
        }

        // Kết quả phiên
        if (cmd === 1003 || ('d1' in payload && 'd2' in payload && 'd3' in payload)) {
          const d1 = payload.d1;
          const d2 = payload.d2;
          const d3 = payload.d3;
          const total = d1 + d2 + d3;
          const outcome = total > 10 ? 'Tai' : 'Xiu';
          console.log(`🎲 ${d1}, ${d2}, ${d3} → Tổng: ${total} → Kết quả: ${outcome}`);
        }
      } else {
        console.warn("⚠️ Dữ liệu không hợp lệ:", data.toString());
      }
    } catch (err) {
      console.error('❌ Lỗi parse JSON:', err.message);
    }
  });

  // === Xử lý lỗi ===
  wsClient.on('error', (err) => {
    console.error('❌ Lỗi kết nối:', err.message);
  });

  // === Khi kết nối bị đóng ===
  wsClient.on('close', (code, reason) => {
    console.log(`🔌 Đã đóng kết nối: ${code} - ${reason.toString()}`);
    console.log('🔁 Thử kết nối lại sau 5 giây...');
    setTimeout(connectWebSocket, 5000);
  });
}

// === API đơn giản để test server đang chạy ===
app.get('/', (req, res) => {
  res.send(`
    <h1>WebSocket Client đang chạy</h1>
    <p>Kết nối tới wss://websocket.atpman.net/websocket</p>
    <p>Xem log trong terminal để thấy kết quả.</p>
  `);
});

// === Khởi động server ===
const server = http.createServer(app);
server.listen(PORT, 'localhost', () => {
  console.log(`🌐 Server đang chạy tại http://localhost:${PORT}`);
  connectWebSocket(); // Bắt đầu kết nối WebSocket
});
