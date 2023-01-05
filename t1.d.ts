export interface B<T> {
  a: string;
  b: number;
  c: B<T>;
}
