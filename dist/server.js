"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importStar(require("ws"));
function generateUniqueId(length = 8) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let uniqueId = "";
    for (let i = 0; i < length; i++) {
        uniqueId += characters[Math.floor(Math.random() * characters.length)];
    }
    return uniqueId;
}
const wss = new ws_1.WebSocketServer({ port: 3000 });
const rooms = new Map();
wss.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("message", (message) => {
        var _a, _b;
        const data = JSON.parse(message.toString());
        if (data.type === "create-room") {
            const roomId = generateUniqueId();
            rooms.set(roomId, new Set([{ socket: ws, username: data.username }]));
            ws.send(JSON.stringify({ type: "room-created", roomId }));
            console.log(`Room created: ${roomId} by ${data.username}`);
        }
        else if (data.type === "join-room") {
            const { roomId, username } = data;
            if (!rooms.has(roomId)) {
                rooms.set(roomId, new Set());
            }
            (_a = rooms.get(roomId)) === null || _a === void 0 ? void 0 : _a.add({ socket: ws, username });
            ws.send(JSON.stringify({ type: "room-joined", roomId }));
            console.log(`${username} joined room: ${roomId}`);
        }
        else if (data.type === "message") {
            const { roomId, username, msg } = data;
            if (rooms.has(roomId)) {
                (_b = rooms.get(roomId)) === null || _b === void 0 ? void 0 : _b.forEach(client => {
                    if (client.socket.readyState === ws_1.default.OPEN) {
                        client.socket.send(JSON.stringify({ type: "message", from: username, msg }));
                    }
                });
            }
        }
    });
    ws.on("close", () => {
        rooms.forEach((clients, roomId) => {
            clients.forEach(client => {
                if (client.socket === ws) {
                    clients.delete(client);
                    console.log(`${client.username} left room: ${roomId}`);
                }
            });
            if (clients.size === 0) {
                rooms.delete(roomId);
                console.log(`Room ${roomId} deleted (empty)`);
            }
        });
    });
});
