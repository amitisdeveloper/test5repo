const express = require('express');
const eventEmitter = require('../utils/eventEmitter');
const router = express.Router();

const clients = [];

router.get('/subscribe', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const clientId = Date.now();
  const client = { id: clientId, res };
  clients.push(client);

  console.log(`[SSE] Client connected. Total clients: ${clients.length}`);

  res.write('data: {"type": "connected"}\n\n');

  const eventListener = (data) => {
    console.log(`[SSE] Event listener triggered for client ${clientId}:`, data.type);
    console.log(`[SSE] Broadcasting to ${clients.length} total client(s)`);
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      console.log(`[SSE] Writing message to client ${clientId}`);
      res.write(message);
      console.log(`[SSE] Message sent successfully to client ${clientId}`);
    } catch (error) {
      console.error(`[SSE] Error writing to client ${clientId}:`, error.message);
    }
  };

  eventEmitter.on('result-posted', eventListener);
  eventEmitter.on('game-created', eventListener);
  eventEmitter.on('game-updated', eventListener);
  eventEmitter.on('game-deleted', eventListener);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (error) {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    const index = clients.indexOf(client);
    if (index > -1) {
      clients.splice(index, 1);
    }
    eventEmitter.removeListener('result-posted', eventListener);
    eventEmitter.removeListener('game-created', eventListener);
    eventEmitter.removeListener('game-updated', eventListener);
    eventEmitter.removeListener('game-deleted', eventListener);
    console.log(`[SSE] Client disconnected. Total clients: ${clients.length}`);
    res.end();
  });
});

const broadcast = (data) => {
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};

module.exports = { router, broadcast };
