export const noop = () => {};

export const notImplemented = (key: string) => {
    return () => console.warn(`Not implemented: ${key}`);
};

export default noop;
