/**
 * Server-Sent Events (SSE) connection manager.
 * Manages per-user event streams for real-time notifications.
 */

type MessageType = "analysis_complete" | "hotlist_update" | "team_action" | "achievement" | "system";

interface SSEClient {
  id: string;
  userId: string;
  controller: ReadableStreamDefaultController;
  createdAt: number;
}

const clients = new Map<string, SSEClient>();

/**
 * Register a new SSE client. Returns a ReadableStream for the response.
 */
export function createSSEStream(userId: string): ReadableStream {
  const clientId = `${userId}_${Date.now()}`;

  const stream = new ReadableStream({
    start(controller) {
      clients.set(clientId, { id: clientId, userId, controller, createdAt: Date.now() });

      // Send keepalive comment every 30s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
          clients.delete(clientId);
        }
      }, 30000);

      // Send initial connected event
      const msg = `event: connected\ndata: ${JSON.stringify({ clientId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(msg));
    },
    cancel() {
      clients.delete(clientId);
    },
  });

  return stream;
}

/**
 * Push an event to a specific user's SSE connections.
 */
export function pushToUser(userId: string, type: MessageType, data: any): void {
  const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(msg);

  for (const [id, client] of clients) {
    if (client.userId === userId) {
      try {
        client.controller.enqueue(encoded);
      } catch {
        clients.delete(id);
      }
    }
  }
}

/**
 * Broadcast an event to all connected clients.
 */
export function broadcast(type: MessageType, data: any): void {
  const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(msg);

  for (const [id, client] of clients) {
    try {
      client.controller.enqueue(encoded);
    } catch {
      clients.delete(id);
    }
  }
}

/**
 * Get connected client count.
 */
export function getClientCount(): number {
  return clients.size;
}
