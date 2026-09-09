import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import pgl from './db.js';
dotenv.config();

const wss = new WebSocketServer({ port: 4005 });


const matchSockets = new Map();
const socketMeta = new Map();

wss.on('connection', (ws, req) => {
  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'init') {
        socketMeta.set(ws, { userId: data.userId, matchId: data.matchId });
        if (!matchSockets.has(data.matchId)) matchSockets.set(data.matchId, new Set());
        matchSockets.get(data.matchId).add(ws);
        return;
      }
      if (data.type === 'message') {
        const result = await pgl.query(
          'INSERT INTO messages (match_id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4) RETURNING *',
          [data.matchId, data.senderId, data.receiverId, data.content]
        );
        const msg = result.rows[0];
        let deliveredAt = null;
        if (matchSockets.has(data.matchId)) {
          for (const sock of matchSockets.get(data.matchId)) {
            const meta = socketMeta.get(sock);
            if (meta && meta.userId === data.receiverId && sock.readyState === 1) {
              deliveredAt = new Date();
              await pgl.query('UPDATE messages SET delivered_at = $1 WHERE id = $2', [deliveredAt, msg.id]);
              break;
            }
          }
        }
        const payload = JSON.stringify({
          type: 'message',
          matchId: data.matchId,
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          timestamp: msg.timestamp,
          delivered_at: deliveredAt ? deliveredAt.toISOString() : null,
          read_at: msg.read_at ? msg.read_at.toISOString() : null,
          id: msg.id
        });
        if (matchSockets.has(data.matchId)) {
          for (const sock of matchSockets.get(data.matchId)) {
            if (sock.readyState === 1) sock.send(payload);
          }
        }
      }
      if (data.type === 'read' && data.messageId) {
        const readAt = new Date();
        await pgl.query('UPDATE messages SET read_at = $1 WHERE id = $2', [readAt, data.messageId]);
        if (matchSockets.has(data.matchId)) {
          const payload = JSON.stringify({
            type: 'read',
            messageId: data.messageId,
            matchId: data.matchId,
            read_at: readAt.toISOString()
          });
          for (const sock of matchSockets.get(data.matchId)) {
            if (sock.readyState === 1) sock.send(payload);
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  });

  ws.on('close', () => {
    const meta = socketMeta.get(ws);
    if (meta && matchSockets.has(meta.matchId)) {
      matchSockets.get(meta.matchId).delete(ws);
      if (matchSockets.get(meta.matchId).size === 0) matchSockets.delete(meta.matchId);
    }
    socketMeta.delete(ws);
  });
});

console.log('WebSocket server running on port 4005');
