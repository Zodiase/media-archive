import { expect } from 'expect';
import { spyOn } from 'jest-mock';
import { DiagnosticContext, log, warn, error } from './diagnosticContext';

describe('DiagnosticContext', () => {
    describe('Basic operations', () => {
        it('should set and get a value in the context', () => {
            DiagnosticContext.wrap('test-context', () => {
                DiagnosticContext.set('key', 'value');
                expect(DiagnosticContext.get('key')).toBe('value');
            });
        });

        it('should return default value if key does not exist', () => {
            DiagnosticContext.wrap('test-context', () => {
                expect(DiagnosticContext.get('nonexistent', 'default')).toBe('default');
            });
        });

        it('should return undefined if the key does not exist and no default value is provided', () => {
            DiagnosticContext.wrap('test-context', () => {
                expect(DiagnosticContext.get('nonexistent')).toBeUndefined();
            });
        });

        it('should check if a key exists in the context', () => {
            DiagnosticContext.wrap('test-context', () => {
                DiagnosticContext.set('key', 'value');
                expect(DiagnosticContext.has('key')).toBe(true);
                expect(DiagnosticContext.has('nonexistent')).toBe(false);
            });
        });
    });

    describe('Context identification', () => {
        it('should get the context ID', () => {
            DiagnosticContext.wrap('test-context', () => {
                expect(DiagnosticContext.getContextId()).toBe('test-context');
            });
        });

        it('should get the context data', () => {
            DiagnosticContext.wrap('test-context', () => {
                DiagnosticContext.set('key', 'value');
                expect(DiagnosticContext.getContextData()).toEqual({ key: 'value' });
            });
        });

        it('should return undefined if there is no current context', () => {
            expect(DiagnosticContext.get('key')).toBeUndefined();
            expect(DiagnosticContext.getContextId()).toBeUndefined();
            expect(DiagnosticContext.getContextData()).toBeUndefined();
        });
    });

    describe('Complex test cases', () => {
        it('should handle async functions', (done) => {
            DiagnosticContext.wrap('test-context', () => {
                setTimeout(() => {
                    expect(DiagnosticContext.get('key')).toBe('value');
                    done();
                }, 0);
                DiagnosticContext.set('key', 'value');
            });
            expect(DiagnosticContext.get('key')).toBeUndefined();
        });

        it('should handle nested contexts', () => {
            DiagnosticContext.wrap('outer-context', () => {
                // Check context ID.
                expect(DiagnosticContext.getContextId()).toBe('outer-context');

                DiagnosticContext.set('outer-key', 'outer-value');
                expect(DiagnosticContext.get('outer-key')).toBe('outer-value');

                DiagnosticContext.wrap('inner-context', () => {
                    // Check context ID.
                    expect(DiagnosticContext.getContextId()).toBe('outer-context/inner-context');

                    // Outer context should be accessible.
                    expect(DiagnosticContext.get('outer-key')).toBe('outer-value');

                    DiagnosticContext.set('inner-key', 'inner-value');
                    expect(DiagnosticContext.get('inner-key')).toBe('inner-value');

                    // Inner context should be able to override outer context.
                    DiagnosticContext.set('outer-key', 'new-outer-value');
                    expect(DiagnosticContext.get('outer-key')).toBe('new-outer-value');
                });

                // Inner context should not be accessible here.
                expect(DiagnosticContext.get('inner-key')).toBeUndefined();
                // Outer context should not be affected by inner context.
                expect(DiagnosticContext.get('outer-key')).toBe('outer-value');
            });
        });
    });

    describe('Loggers', () => {
        const spy = {
            log: spyOn(console, 'log'),
            warn: spyOn(console, 'warn'),
            error: spyOn(console, 'error'),
        };

        afterEach(() => {
            spy.log.mockClear();
            spy.warn.mockClear();
            spy.error.mockClear();
        });

        afterAll(() => {
            spy.log.mockRestore();
            spy.warn.mockRestore();
            spy.error.mockRestore();
        });

        describe('log', () => {
            it('should log the context ID and data', () => {
                DiagnosticContext.wrap('test-context', () => {
                    DiagnosticContext.set('key', 'value');
                    log('message');
                    expect(spy.log).toHaveBeenCalledWith('test-context', { key: 'value' }, 'message');
                });
            });

            it('should log the context ID and data with multiple arguments', () => {
                DiagnosticContext.wrap('test-context', () => {
                    DiagnosticContext.set('key', 'value');
                    log('message', 'another message');
                    expect(spy.log).toHaveBeenCalledWith(
                        'test-context',
                        { key: 'value' },
                        'message',
                        'another message',
                    );
                });
            });
        });

        describe('warn', () => {
            it('should log the context ID and data', () => {
                DiagnosticContext.wrap('test-context', () => {
                    DiagnosticContext.set('key', 'value');
                    warn('message');
                    expect(spy.warn).toHaveBeenCalledWith('test-context', { key: 'value' }, 'message');
                });
            });

            it('should log the context ID and data with multiple arguments', () => {
                DiagnosticContext.wrap('test-context', () => {
                    DiagnosticContext.set('key', 'value');
                    warn('message', 'another message');
                    expect(spy.warn).toHaveBeenCalledWith(
                        'test-context',
                        { key: 'value' },
                        'message',
                        'another message',
                    );
                });
            });
        });

        describe('error', () => {
            it('should log the context ID and data', () => {
                DiagnosticContext.wrap('test-context', () => {
                    DiagnosticContext.set('key', 'value');
                    error('message');
                    expect(spy.error).toHaveBeenCalledWith('test-context', { key: 'value' }, 'message');
                });
            });

            it('should log the context ID and data with multiple arguments', () => {
                DiagnosticContext.wrap('test-context', () => {
                    DiagnosticContext.set('key', 'value');
                    error('message', 'another message');
                    expect(spy.error).toHaveBeenCalledWith(
                        'test-context',
                        { key: 'value' },
                        'message',
                        'another message',
                    );
                });
            });
        });
    });
});
