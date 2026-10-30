import { registerDecorator, ValidationOptions } from 'class-validator';

/** ≥ 10 caracteres, con minúscula, mayúscula y dígito. Sin exigir símbolos: en móvil se teclean mal. */
export function IsStrongPassword(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) =>
    registerDecorator({
      name: 'isStrongPassword',
      target: target.constructor,
      propertyName: String(propertyKey),
      options: {
        message: 'La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula y un número',
        ...options,
      },
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' &&
            value.length >= 10 &&
            value.length <= 128 &&
            /[a-z]/.test(value) &&
            /[A-Z]/.test(value) &&
            /\d/.test(value)
          );
        },
      },
    });
}
