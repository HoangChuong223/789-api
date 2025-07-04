const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 10000; // Render yêu cầu dùng PORT env

let wsClient = null;

// === Tin nhắn gửi đi ===
const messagesToSend = [
  [1, "MiniGame", "saoban", "ere2234", {
    info: "{\"ipAddress\":\"125.235.239.187\",\"userId\":\"2ef4335a-6562-4c64-b012-46ef83a25800\",\"username\":\"S8_saoban\",\"timestamp\":1749643344994,\"refreshToken\":\"e790adfa529e42639552261c7a7d206b.51b6327dccb94fe1b4a96040d5ded732\"}",
    signature: "20399D67A1EC9E78B287200DE26F206FFEBB01C545C52EDAC0F0C347CF26A7900FB5AD74BC2DC9A35634C0E9F45BF799B3D8696052D5392CFB9BE0F4CF086BE8F50699C542C7693722B4EE68ECDCF72EB887B91A46FC662087E233EE7C10FED14505920B6687F5B9E30B4FF6EACBF1305FDB9A5DC4ED010DBA3C3AB3DAE5AC14"
  }],
  [6, "MiniGame", "taixiuUnbalancedPlugin", { cmd: 2000 }],
];

function connectWebSocket() {
  const headers = {
    'Host': 'websocket.atpman.net',
    'Origin': 'https://789club.sx ',
    'User-Agent': 'Mozilla/5.0'
  };

  wsClient = new WebSocket('wss://websocket.atpman.net/websocket', {
    headers,
  });

  wsClient.on('open', () => {
    console.log('✅ Kết nối WebSocket thành công');
    messagesToSend.forEach((msg, index) => {
      setTimeout(() => {
        if (wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify(msg));
          console.log(`📤 Gửi lệnh ${index + 1}`);
        }
      }, index * 1000);
    });
  });

  wsClient.on('message', (data) => {
    try {
      const rawMessage = data.toString();

      // Kiểm tra nếu là JSON hợp lệ
      let parsed;
      try {
        parsed = JSON.parse(rawMessage);
      } catch (e) {
        console.warn("⚠️ Không phải JSON:", rawMessage);
        return;
      }

      if (Array.isArray(parsed)) {
        console.log("📨 Nhận phản hồi:", parsed);

        // Xử lý phiên mới
        if (parsed[0] === 2 && typeof parsed[1] === 'object' && parsed[1].hasOwnProperty('sid')) {
          const sid = parsed[1].sid;
          console.log(`🎮 Phiên mới: ${sid}`);
        }

        // Xử lý kết quả phiên
        if (parsed[0] === 2 && parsed[1]?.hasOwnProperty('d1') && parsed[1]?.hasOwnProperty('d2') && parsed[1]?.hasOwnProperty('d3')) {
          const { d1, d2, d3 } = parsed[1];
          const total = d1 + d2 + d3;
          const result = total > 10 ? 'Tai' : 'Xiu';
          console.log(`🎲 Kết quả: ${d1}, ${d2}, ${d3} → Tổng: ${total} → ${result}`);
        }
      } else {
        console.warn("⚠️ Dữ liệu không phải dạng array:", parsed);
      }
    } catch (err) {
      console.error("❌ Lỗi xử lý message:", err.message);
    }
  });

  wsClient.on('error', (err) => {
    console.error("❌ Lỗi kết nối WebSocket:", err.message);
  });

  wsClient.on('close', (code, reason) => {
    console.log(`🔌 Đã đóng kết nối: ${code} - ${reason.toString()}`);
    console.log("🔁 Thử kết nối lại sau 5 giây...");
    setTimeout(connectWebSocket, 5000);
  });
}

// === API đơn giản để Render xác nhận app đang chạy ===
app.get('/', (req, res) => {
  res.send(`
    <h1>WebSocket Client đang chạy</h1>
    <p>Xem log trong terminal để theo dõi kết quả.</p>
  `);
});

// === Khởi động server ===
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server đang chạy tại http://0.0.0.0:${PORT}`);
  connectWebSocket();
});
