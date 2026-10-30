import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  BBox,
  DISPATCH_ROOM,
  geohashCellsForBBox,
  hasPermission,
  PERMISSIONS,
  roomForCell,
  roomForDistrict,
  WS_NAMESPACE,
  WsEvents,
} from '@geoalert/contracts';
import { parse as parseCookies } from 'cookie';
import type { Namespace, Socket } from 'socket.io';
import { env, SESSION_COOKIE } from '../../../config/env';
import { SessionService } from '../../auth/services/session.service';
import { AccessResolver } from '../../rbac/services/access-resolver.service';
import type { AccessProfile } from '../../rbac/types/identity.types';
import type { RoomBroadcaster } from '../rooms';

interface SocketData {
  principal: AccessProfile | null;
}
type ClientSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;

const MAX_CELLS = 64;

/**
 * Gateway de tiempo real. Las salas por celda geohash permiten que cada cliente reciba
 * solo lo que pasa en su viewport (como Waze), en lugar de todo Piura.
 *
 *   cell:<geohash5|geohash4>  → vecinos mirando esa zona del mapa
 *   district:<slug>           → suscripción explícita por distrito (alertas push)
 *   dispatch                  → Defensa Civil / COER (permiso alerts.receive): recibe todo
 */
@WebSocketGateway({
  namespace: WS_NAMESPACE,
  cors: { origin: env.webOrigin, credentials: true },
  transports: ['websocket', 'polling'],
})
export class IncidentsGateway implements OnGatewayConnection, RoomBroadcaster {
  @WebSocketServer() private readonly nsp!: Namespace;

  constructor(
    private readonly sessions: SessionService,
    private readonly access: AccessResolver,
  ) {}

  async handleConnection(socket: ClientSocket): Promise<void> {
    // Cross-Site WebSocket Hijacking: el navegador envía cookies en el handshake desde cualquier origen.
    if (socket.handshake.headers.origin !== env.webOrigin) {
      socket.disconnect(true);
      return;
    }
    const cookies = parseCookies(socket.handshake.headers.cookie ?? '');
    const claims = await this.sessions.verify(cookies[SESSION_COOKIE]);
    const principal = claims ? await this.access.resolve(claims.sub) : null;
    socket.data.principal = principal; // anónimo permitido: el mapa público también es en vivo

    if (principal && hasPermission(principal.permissions, PERMISSIONS.AlertsReceive)) {
      await socket.join(DISPATCH_ROOM);
    }
  }

  @SubscribeMessage(WsEvents.ViewportSubscribe)
  async onViewport(@ConnectedSocket() socket: ClientSocket, @MessageBody() body: { bbox?: unknown }) {
    const bbox = parseBBox(body?.bbox);
    if (!bbox) return { ok: false, error: 'bbox inválido' };

    // Precisión fina si el viewport es pequeño; si no, celdas gruesas; si es enorme, sin salas (el cliente hace polling).
    const cells = geohashCellsForBBox(bbox, 5, MAX_CELLS) ?? geohashCellsForBBox(bbox, 4, MAX_CELLS) ?? [];
    const next = new Set(cells.map(roomForCell));

    for (const room of socket.rooms) {
      if (room.startsWith('cell:') && !next.has(room)) await socket.leave(room);
    }
    await socket.join([...next]);
    return { ok: true, cells: next.size };
  }

  @SubscribeMessage(WsEvents.DistrictSubscribe)
  async onDistrict(@ConnectedSocket() socket: ClientSocket, @MessageBody() body: { district?: unknown }) {
    if (typeof body?.district !== 'string' || body.district.length > 80) return { ok: false };
    await socket.join(roomForDistrict(body.district));
    return { ok: true };
  }

  broadcast(rooms: string[], event: string, payload: unknown): void {
    this.nsp.to(rooms).emit(event, payload);
  }
}

function parseBBox(raw: unknown): BBox | null {
  if (!Array.isArray(raw) || raw.length !== 4 || !raw.every((n) => typeof n === 'number' && Number.isFinite(n))) {
    return null;
  }
  const [minLng, minLat, maxLng, maxLat] = raw as BBox;
  if (minLng >= maxLng || minLat >= maxLat || minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180) {
    return null;
  }
  return [minLng, minLat, maxLng, maxLat];
}
