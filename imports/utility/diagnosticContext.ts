import { AsyncLocalStorage } from 'node:async_hooks';

const contextAsyncLocalStorage = new AsyncLocalStorage<{
    contextId: string;
    contextData: Map<string, unknown>;
}>();

export class DiagnosticContext {
    /**
     * Set a value in the context.
     * If there is no current context, this function does nothing.
     * @param key The key to set.
     * @param value The value to set.
     */
    static set(key: string, value: unknown): void {
        const currentContext = contextAsyncLocalStorage.getStore();
        if (!currentContext) {
            return;
        }

        currentContext.contextData.set(key, value);
    }

    /**
     * Check if a key exists in the context.
     * If there is no current context, this function returns false.
     * @param key
     * @returns True if the key exists, otherwise false.
     */
    static has(key: string): boolean {
        const currentContext = contextAsyncLocalStorage.getStore();
        if (!currentContext) {
            return false;
        }

        return currentContext.contextData.has(key);
    }

    /**
     * Get a value from the context.
     * If there is no current context, this function returns the default value if provided.
     * Note that this function does not validate the type of the return value.
     * @template T The expected type of the return value.
     * @param key
     * @param defaultValue
     * @returns The value if it exists, otherwise the default value if provided, otherwise undefined.
     */
    static get<T = unknown>(key: string, defaultValue?: T): T | void {
        const currentContext = contextAsyncLocalStorage.getStore();
        if (!currentContext) {
            return defaultValue;
        }

        return (currentContext.contextData.get(key) as T) ?? defaultValue;
    }

    /**
     * Get the context ID.
     * @returns The context ID if it exists, otherwise undefined.
     */
    static getContextId(): string | void {
        const currentContext = contextAsyncLocalStorage.getStore();
        if (!currentContext) {
            return;
        }

        return currentContext.contextId;
    }

    /**
     * Get the context data.
     * @returns The context data if it exists, otherwise undefined.
     */
    static getContextData(): Record<string, unknown> | void {
        const currentContext = contextAsyncLocalStorage.getStore();
        if (!currentContext) {
            return;
        }

        return Object.fromEntries(currentContext.contextData);
    }

    /**
     * @template R The return type of the function.
     * @param fn The function to run.
     * @returns
     */
    static wrap<R>(contextId: string, fn: () => R): R {
        const currentContext = contextAsyncLocalStorage.getStore();
        const newContextId = currentContext ? [currentContext.contextId, contextId].join('/') : contextId;
        const newContextData = currentContext ? new Map(currentContext.contextData) : new Map();

        return contextAsyncLocalStorage.run(
            {
                contextId: newContextId,
                contextData: newContextData,
            },
            fn,
        );
    }
}

const createLogger = (level: 'log' | 'warn' | 'error') => (...args: unknown[]) => {
    console[level](DiagnosticContext.getContextId(), DiagnosticContext.getContextData(), ...args);
};

export const log = createLogger('log');

export const warn = createLogger('warn');

export const error = createLogger('error');
