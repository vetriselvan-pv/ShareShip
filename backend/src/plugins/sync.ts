import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { PartnerLink, SyncEvent, UserRole } from '../types/index.js';

interface SpaceState {
  link: PartnerLink;
  events: SyncEvent[];
  activeConnections: Map<string, { socket: WebSocket; role: UserRole; userId: string }>;
}

export class SpaceSyncManager {
  private spaces: Map<string, SpaceState> = new Map();

  getOrCreateSpace(spaceId: string = 'shared-space', myName: string = 'You', partnerName: string = 'Partner'): SpaceState {
    let space = this.spaces.get(spaceId);
    if (!space) {
      space = {
        link: {
          spaceId,
          spaceName: 'Shared Space',
          me: {
            id: 'user_me',
            name: myName,
            email: '',
            avatarUrl: '',
            initial: (myName || 'Y').charAt(0).toUpperCase(),
            status: 'online',
            lastSeen: new Date().toISOString()
          },
          partner: {
            id: 'user_partner',
            name: partnerName,
            email: '',
            avatarUrl: '',
            initial: (partnerName || 'P').charAt(0).toUpperCase(),
            status: 'online',
            lastSeen: new Date().toISOString()
          },
          syncStatus: 'synced',
          isLiveSyncActive: true,
          connectedSince: new Date().toISOString()
        },
        events: [],
        activeConnections: new Map()
      };
      this.spaces.set(spaceId, space);
    }
    return space;
  }

  getSpace(spaceId: string = 'shared-space'): SpaceState | undefined {
    return this.spaces.get(spaceId) || this.getOrCreateSpace(spaceId);
  }

  registerConnection(spaceId: string, connectionId: string, socket: WebSocket, role: UserRole, userId: string) {
    const space = this.getOrCreateSpace(spaceId);

    space.activeConnections.set(connectionId, { socket, role, userId });

    // Update partner presence
    if (role === 'partner') {
      space.link.partner.status = 'online';
      space.link.partner.lastSeen = new Date().toISOString();
    } else {
      space.link.me.status = 'online';
      space.link.me.lastSeen = new Date().toISOString();
    }
    space.link.isLiveSyncActive = true;
    space.link.syncStatus = 'synced';

    // Broadcast updated state to all participants
    this.broadcast(spaceId, {
      type: 'presence',
      action: 'ping',
      spaceId,
      authorId: userId,
      authorRole: role,
      authorName: role === 'partner' ? space.link.partner.name : space.link.me.name,
      payload: { link: space.link },
      id: `evt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      version: space.events.length + 1
    });
  }

  removeConnection(spaceId: string, connectionId: string) {
    const space = this.spaces.get(spaceId);
    if (!space) return;

    const conn = space.activeConnections.get(connectionId);
    space.activeConnections.delete(connectionId);

    if (conn) {
      if (conn.role === 'partner') {
        space.link.partner.status = 'away';
      }
    }
  }

  publishSyncEvent(spaceId: string, event: Omit<SyncEvent, 'id' | 'timestamp' | 'version'>): SyncEvent {
    const space = this.getOrCreateSpace(spaceId);

    const fullEvent: SyncEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      version: space.events.length + 1
    };

    space.events.push(fullEvent);
    this.broadcast(spaceId, fullEvent);
    return fullEvent;
  }

  private broadcast(spaceId: string, payload: unknown) {
    const space = this.spaces.get(spaceId);
    if (!space) return;

    const data = JSON.stringify(payload);
    for (const { socket } of space.activeConnections.values()) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    }
  }
}

export const syncManager = new SpaceSyncManager();

export async function syncPlugin(fastify: FastifyInstance) {
  fastify.get('/ws/sync', { websocket: true }, (socket, req) => {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const url = new URL(req.url, 'http://localhost');
    const spaceId = url.searchParams.get('spaceId') || 'shared-space';
    const role = (url.searchParams.get('role') as UserRole) || 'me';
    const userId = url.searchParams.get('userId') || (role === 'partner' ? 'user_partner' : 'user_me');

    syncManager.registerConnection(spaceId, connectionId, socket, role, userId);

    // Send initial greeting with current space connection metadata
    const space = syncManager.getSpace(spaceId);
    if (space) {
      socket.send(JSON.stringify({
        type: 'initial_sync',
        link: space.link,
        recentEvents: space.events.slice(-20)
      }));
    }

    socket.on('message', (message: string) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'action') {
          syncManager.publishSyncEvent(spaceId, {
            spaceId,
            authorId: userId,
            authorRole: role,
            authorName: role === 'partner' ? space?.link.partner.name || 'Partner' : space?.link.me.name || 'You',
            type: parsed.itemType || 'note',
            action: parsed.action || 'create',
            payload: parsed.payload
          });
        }
      } catch (err) {
        fastify.log.error(err);
      }
    });

    socket.on('close', () => {
      syncManager.removeConnection(spaceId, connectionId);
    });
  });
}
