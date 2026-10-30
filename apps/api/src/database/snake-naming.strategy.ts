import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

const snake = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

/** Propiedades camelCase en TypeScript ↔ columnas snake_case en PostgreSQL. */
export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  override columnName(propertyName: string, customName: string | undefined, prefixes: string[]): string {
    return customName ?? snake([...prefixes, propertyName].join('_'));
  }

  override relationName(propertyName: string): string {
    return snake(propertyName);
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return snake(`${relationName}_${referencedColumnName}`);
  }

  override joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return snake(`${tableName}_${columnName ?? propertyName}`);
  }
}
