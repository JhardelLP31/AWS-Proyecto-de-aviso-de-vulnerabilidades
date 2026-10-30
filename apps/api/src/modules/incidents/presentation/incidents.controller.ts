import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MAX_PHOTOS_PER_INCIDENT, PERMISSIONS } from '@geoalert/contracts';
import { memoryStorage } from 'multer';
import { Audit } from '../../audit/presentation/audit.decorator';
import type { AccessProfile } from '../../rbac/domain/identity';
import { CurrentUser, Public, RequirePermissions } from '../../rbac/presentation/rbac.decorators';
import { SERVER_MAX_PHOTO_BYTES } from '../application/photo-inspector';
import { IncidentService } from '../application/incident.service';
import { BoundsQueryDto, CastVoteDto, ReportIncidentDto, TriageDto, VerifyDto } from './dto/incident.dto';
import { toIncidentDTO } from './incident.mapper';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidents: IncidentService) {}

  private dto = (i: Parameters<typeof toIncidentDTO>[0]) => toIncidentDTO(i, (k) => this.incidents.photoUrl(k));

  /** Mapa público: en una emergencia cualquiera debe poder ver las zonas de riesgo sin registrarse. */
  @Public()
  @Get()
  async list(@Query() q: BoundsQueryDto) {
    const items = await this.incidents.findInBounds(q.bbox, q.status ?? ['PENDING', 'VERIFIED'], q.since);
    return items.map(this.dto);
  }

  @Public()
  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return this.dto(await this.incidents.getById(id));
  }

  /** multipart/form-data: campos de ReportIncidentDto + hasta 3 archivos `photos` (WebP ≤ 150 KB). */
  @Post()
  @RequirePermissions(PERMISSIONS.IncidentsCreate)
  @Audit({ action: 'incidents.create', resource: 'incident' })
  @UseInterceptors(
    FilesInterceptor('photos', MAX_PHOTOS_PER_INCIDENT, {
      storage: memoryStorage(), // Lambda: sin disco; las fotos ya vienen comprimidas
      limits: { fileSize: SERVER_MAX_PHOTO_BYTES, files: MAX_PHOTOS_PER_INCIDENT, fields: 12, fieldSize: 4 * 1024 },
    }),
  )
  async report(
    @Body() body: ReportIncidentDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @CurrentUser() user: AccessProfile,
  ) {
    const incident = await this.incidents.report({ ...body, photos: (files ?? []).map((f) => f.buffer) }, user);
    return this.dto(incident);
  }

  @Post(':id/votes')
  @RequirePermissions(PERMISSIONS.IncidentsVote)
  @Audit({ action: 'incidents.vote', resource: 'incident' })
  async vote(@Param('id', ParseUUIDPipe) id: string, @Body() body: CastVoteDto, @CurrentUser() user: AccessProfile) {
    return this.dto(await this.incidents.vote(id, body, user));
  }

  @Patch(':id/triage')
  @RequirePermissions(PERMISSIONS.TriageUpdate)
  @Audit({ action: 'triage.update', resource: 'incident' })
  async triage(@Param('id', ParseUUIDPipe) id: string, @Body() body: TriageDto) {
    const { _atLeastOne: _ignored, ...cmd } = body;
    return this.dto(await this.incidents.triage(id, cmd));
  }

  /** Verificación manual por autoridad (atajo de triaje que solo cambia el estado). */
  @Post(':id/verify')
  @RequirePermissions(PERMISSIONS.IncidentsVerify)
  @Audit({ action: 'incidents.verify', resource: 'incident' })
  async verify(@Param('id', ParseUUIDPipe) id: string, @Body() { expectedVersion }: VerifyDto) {
    return this.dto(await this.incidents.triage(id, { status: 'VERIFIED', expectedVersion }));
  }
}
