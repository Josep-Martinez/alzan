export function shouldBeNever(value: never): never {
  throw new Error(`Value ${value} should be never`);
}
