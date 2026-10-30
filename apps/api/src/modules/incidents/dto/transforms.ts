export const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
export const csv = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.split(',') : value);
export const csvNumbers = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.split(',').map((n) => (n.trim() === '' ? Number.NaN : Number(n))) : value;
