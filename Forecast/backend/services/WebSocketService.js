const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map();
        this.channels = new Map();
    }

    initialize(server) {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', async (ws, req) => {
            try {
                const client = await this.authenticateConnection(ws, req);
                this.setupClientHandlers(client);
            } catch (error) {
                logger.error('WebSocket connection error:', error);
                ws.close(1008, 'Authentication failed');
            }
        });

        // Heartbeat to keep connections alive
        setInterval(() => {
            this.wss.clients.forEach(client => {
                if (client.isAlive === false) {
                    return client.terminate();
                }
                client.isAlive = false;
                client.ping();
            });
        }, 30000);
    }

    async authenticateConnection(ws, req) {
        const token = this.extractToken(req);
        if (!token) {
            throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const client = {
            ws,
            userId: decoded.userId,
            subscriptions: new Set(),
            isAlive: true
        };

        this.clients.set(ws, client);
        return client;
    }

    extractToken(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        return url.searchParams.get('token');
    }

    setupClientHandlers(client) {
        const { ws } = client;

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                await this.handleClientMessage(client, data);
            } catch (error) {
                logger.error('WebSocket message handling error:', error);
                this.sendError(ws, 'Invalid message format');
            }
        });

        ws.on('pong', () => {
            client.isAlive = true;
        });

        ws.on('close', () => {
            this.handleClientDisconnection(client);
        });
    }

    async handleClientMessage(client, message) {
        switch (message.type) {
            case 'subscribe':
                await this.handleSubscription(client, message.channels);
                break;
            case 'unsubscribe':
                this.handleUnsubscription(client, message.channels);
                break;
            case 'message':
                await this.handleClientBroadcast(client, message);
                break;
            default:
                this.sendError(client.ws, 'Unknown message type');
        }
    }

    async handleSubscription(client, channels) {
        for (const channel of channels) {
            // Validate channel access
            if (await this.canAccessChannel(client, channel)) {
                client.subscriptions.add(channel);
                
                if (!this.channels.has(channel)) {
                    this.channels.set(channel, new Set());
                }
                this.channels.get(channel).add(client);

                this.sendToClient(client, {
                    type: 'subscribed',
                    channel
                });
            } else {
                this.sendError(client.ws, `Access denied to channel: ${channel}`);
            }
        }
    }

    handleUnsubscription(client, channels) {
        channels.forEach(channel => {
            client.subscriptions.delete(channel);
            this.channels.get(channel)?.delete(client);
        });
    }

    async handleClientBroadcast(client, message) {
        if (!message.channel || !client.subscriptions.has(message.channel)) {
            return this.sendError(client.ws, 'Invalid channel');
        }

        await this.broadcast(message.channel, {
            type: 'message',
            channel: message.channel,
            data: message.data,
            sender: client.userId
        });
    }

    handleClientDisconnection(client) {
        client.subscriptions.forEach(channel => {
            this.channels.get(channel)?.delete(client);
        });
        this.clients.delete(client.ws);
    }

    async canAccessChannel(client, channel) {
        // Implement channel access control logic
        return true; // Placeholder
    }

    async broadcast(channel, message) {
        const subscribers = this.channels.get(channel);
        if (!subscribers) return;

        const payload = JSON.stringify(message);
        
        subscribers.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(payload);
            }
        });
    }

    sendToClient(client, message) {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    }

    sendError(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'error',
                message
            }));
        }
    }

    getStats() {
        return {
            totalConnections: this.clients.size,
            channels: Array.from(this.channels.entries()).map(([name, clients]) => ({
                name,
                subscribers: clients.size
            }))
        };
    }
}

module.exports = new WebSocketService(); 