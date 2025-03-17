const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketManager {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map();
        this.initialize();
    }

    initialize() {
        this.wss.on('connection', async (ws, req) => {
            try {
                // Authenticate connection
                const token = req.url.split('token=')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Store client connection
                this.clients.set(ws, {
                    userId: decoded.userId,
                    subscriptions: new Set()
                });

                // Handle messages
                ws.on('message', (message) => this.handleMessage(ws, message));
                
                // Handle disconnection
                ws.on('close', () => this.handleDisconnection(ws));

                // Send initial connection success
                ws.send(JSON.stringify({
                    type: 'connection',
                    status: 'success'
                }));

            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Authentication failed'
                }));
                ws.close();
            }
        });
    }

    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'subscribe':
                    this.handleSubscription(ws, data.channels);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscription(ws, data.channels);
                    break;
                default:
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Unknown message type'
                    }));
            }
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    }

    handleSubscription(ws, channels) {
        const client = this.clients.get(ws);
        if (client) {
            channels.forEach(channel => client.subscriptions.add(channel));
        }
    }

    handleUnsubscription(ws, channels) {
        const client = this.clients.get(ws);
        if (client) {
            channels.forEach(channel => client.subscriptions.delete(channel));
        }
    }

    handleDisconnection(ws) {
        this.clients.delete(ws);
    }

    broadcast(channel, data) {
        this.clients.forEach((client, ws) => {
            if (client.subscriptions.has(channel) && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'update',
                    channel,
                    data
                }));
            }
        });
    }

    sendToUser(userId, data) {
        this.clients.forEach((client, ws) => {
            if (client.userId === userId && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'private',
                    data
                }));
            }
        });
    }
}

module.exports = WebSocketManager; 