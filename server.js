const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 5000;
let html = "";

const WS_URL = "wss://websocket.atpman.net/websocket";
const PING_INTERVAL = 10000;
const CMD2000_INTERVAL = 30000;
const SIMMS_INTERVAL = 15000;

let lastEventId = 19;

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
    signature: "47D64C1BB382E32AD40837624A640609370AAD1D67B5B1B51FDE6BB205DD5AB1FCE9A008DF7D7E5DA718F718A1B587B08D228B3F5AE670E8242046B56213AA0B407C4B4AFAC146ACFA24162F11DF5F444CDDDBE3F2CE3439C7F25E5947787CDE863FFE350934133552D2CAFCF5E1DBB1A91BD987254A44479B42F99F0509251F"
  }
];

const SUBSCRIBE_TX_RESULT = [6, "MiniGame", "taixiuUnbalancedPlugin", { cmd: 2000 }];
const SUBSCRIBE_LOBBY = [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }];

function connectWebSocket() {
  const ws = new WebSocket(WS_URL, { headers: HEADERS });

  ws.on('open', () => {
    console.log("✅ Đã kết nối WebSocket");

    ws.send(JSON.stringify(LOGIN_MESSAGE));
    setTimeout(() => {
      ws.send(JSON.stringify(SUBSCRIBE_TX_RESULT));
      ws.send(JSON.stringify(SUBSCRIBE_LOBBY));
    }, 1000);

    setInterval(() => ws.send("2"), PING_INTERVAL);
    setInterval(() => ws.send(JSON.stringify(SUBSCRIBE_TX_RESULT)), CMD2000_INTERVAL);
    setInterval(() => ws.send(JSON.stringify([7, "Simms", lastEventId, 0, { id: 0 }])), SIMMS_INTERVAL);
  });

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (Array.isArray(data)) {
        if (data[0] === 7 && data[1] === "Simms" && Number.isInteger(data[2])) {
          lastEventId = data[2];
        }

        if (data.length > 1 && typeof data[1] === 'object') {
          const payload = data[1];

          if (payload.cmd === 2006) {
            const sid = payload.sid;
            const d1 = payload.d1;
            const d2 = payload.d2;
            const d3 = payload.d3;
            const total = d1 + d2 + d3;
            const result = total >= 11 ? "Tài" : "Xỉu";

            const line = `Phiên: ${sid} | Xúc xắc: ${d1}-${d2}-${d3} | Tổng: ${total} => ${result} | binhtool90`;

            console.log(line);
            html = line + "<br>" + html; // Đẩy kết quả mới lên đầu
          }
        }
      }
    } catch (err) {
      console.error("Lỗi xử lý:", err.message);
    }
  });

  ws.on('close', () => {
    console.log("🔌 Mất kết nối WebSocket. Đang thử lại...");
    setTimeout(connectWebSocket, 5000);
  });

  ws.on('error', (err) => {
    console.error("❌ WebSocket lỗi:", err.message);
  });
}

// HTTP server in kết quả ra trình duyệt
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`<h2>Kết quả Tài/Xỉu:</h2>${html}`);
});

server.listen(PORT, () => {
  console.log(`🟢 Server chạy tại http://localhost:${PORT}`);
  connectWebSocket();
});
