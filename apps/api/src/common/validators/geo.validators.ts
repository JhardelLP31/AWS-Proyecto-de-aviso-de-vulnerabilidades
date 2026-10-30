import { isInsideBBox, PIURA_BBOX } from '@geoalert/contracts';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

/**
 * Valida que el objeto tenga `lat`/`lng` dentro del área de cobertura (departamento de Piura).
 * Se aplica sobre la propiedad `lng` para que el error apunte a coordenadas.
 *   @IsInsidePiura() lng!: number;
 */
export function IsInsidePiura(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) =>
    registerDecorator({
      name: 'isInsidePiura',
      target: target.constructor,
      propertyName: String(propertyKey),
      options: { message: 'La ubicación está fuera del área de cobertura (Piura)', ...options },
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const { lat, lng } = args.object as { lat?: unknown; lng?: unknown };
          return typeof lat === 'number' && typeof lng === 'number' && isInsideBBox({ lat, lng }, PIURA_BBOX);
        },
      },
    });
}

/** [minLng, minLat, maxLng, maxLat] finito, ordenado y dentro de rangos WGS84. */
export function IsBBox(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) =>
    registerDecorator({
      name: 'isBBox',
      target: target.constructor,
      propertyName: String(propertyKey),
      options: { message: 'bbox debe ser "minLng,minLat,maxLng,maxLat" válido', ...options },
      validator: {
        validate(value: unknown) {
          if (!Array.isArray(value) || value.length !== 4) return false;
          if (!value.every((n) => typeof n === 'number' && Number.isFinite(n))) return false;
          const [minLng, minLat, maxLng, maxLat] = value as number[];
          return minLng < maxLng && minLat < maxLat && minLng >= -180 && maxLng <= 180 && minLat >= -90 && maxLat <= 90;
        },
      },
    });
}
