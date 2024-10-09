import { Expect } from './Expect';
import { TypesMatch } from './TypesMatch';

/**
 * This helper type creates a new type that is the difference between two types.
 * Specifically:
 * 1. If both types have the same property of the same type, the result type will have that property as optional.
 * 2. If both types have the same property of different types, the result type will have that property with the type of the second type.
 * 3. If U type has a property that T type does not have, the result type will have that property.
 */
export type DiffTowards<T, U> = {
    [K in keyof U as K extends keyof T ? (U[K] extends T[K] ? never : K) : K]: U[K];
} & {
    [K in keyof U as K extends keyof T ? (U[K] extends T[K] ? K : never) : never]?: U[K];
};

type Tests = [
    // If both types have the same property of the same type, the result type will have that property as optional.
    Expect<TypesMatch<DiffTowards<{ a: string }, { a: string }>, { a?: string }>>,
    // If both types have the same property of different types, the result type will have that property with the type of the second type.
    Expect<TypesMatch<DiffTowards<{ a: string }, { a: number }>, { a: number }>>,
    // If U type has a property that T type does not have, the result type will have that property.
    Expect<TypesMatch<DiffTowards<{ a: string }, { b: number }>, { b: number }>>,
];
