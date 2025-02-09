import WebSocket, { WebSocketServer } from "ws";

function generateUniqueId(length: number = 8): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let uniqueId = "";
    for (let i = 0; i < length; i++) {
        uniqueId += characters[Math.floor(Math.random() * characters.length)];
    }
    return uniqueId;
}

const wss = new WebSocketServer({ port: 3000 });

interface ClientData {
    socket: WebSocket;
    username: string;
}

const rooms: Map<string, Set<ClientData>> = new Map();

wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", (message) => {
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
            rooms.get(roomId)?.add({ socket: ws, username });
            ws.send(JSON.stringify({ type: "room-joined", roomId }));
            console.log(`${username} joined room: ${roomId}`);
        } 
        else if (data.type === "message") {
            const { roomId, username, msg } = data;
            if (rooms.has(roomId)) {
                rooms.get(roomId)?.forEach(client => {
                    if (client.socket.readyState === WebSocket.OPEN) {
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
