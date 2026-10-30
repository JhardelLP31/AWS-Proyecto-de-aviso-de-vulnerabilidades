import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsStrongPassword()
  password!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 120)
  displayName!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  district?: string;

  /** Celular peruano: 9 dígitos que empiezan en 9 (opcionalmente con +51). */
  @IsOptional()
  @Matches(/^(\+51)?9\d{8}$/, { message: 'phone debe ser un celular peruano válido' })
  phone?: string;
}
