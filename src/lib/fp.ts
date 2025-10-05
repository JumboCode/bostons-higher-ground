export type Result<T, E extends Error> =
    | { value: T, error: null }
    | { value: null, error: E }

export function tryCatch<T, E extends Error>(fn: () => T): Result<T, E> {
    try {
        const data = fn();
        return { value: data, error: null };
    } catch (error) {
        return { value: null, error: error as E };
    }
}
