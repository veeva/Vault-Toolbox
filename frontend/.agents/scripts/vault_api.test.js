/* global __dirname, Buffer */

import fs from 'fs';
import https from 'https';
import path from 'path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    formatSessionId,
    encrypt,
    decrypt,
    resolveApiVersion,
    pollJob,
    resetVersionCache
} from './vault_api.js';

const ENV_PATH = path.join(__dirname, '../data/vault_env.json');

const originalExistsSync = fs.existsSync;
const originalReadFileSync = fs.readFileSync;
const originalWriteFileSync = fs.writeFileSync;

describe('formatSessionId — API Access Token & Session ID Formatter', () => {
    it('returns the input unchanged if it does not contain the veeva-vault- token marker', () => {
        expect(formatSessionId('standard_session_id_12345')).toBe('standard_session_id_12345');
        expect(formatSessionId(null)).toBe(null);
        expect(formatSessionId(undefined)).toBe(undefined);
        expect(formatSessionId('')).toBe('');
    });

    it('corrects and prepends Bearer prefix if veeva-vault- token is provided without it', () => {
        expect(formatSessionId('veeva-vault-token123')).toBe('Bearer veeva-vault-token123');
    });

    it('replaces or corrects formatting if Bearer prefix has no space', () => {
        expect(formatSessionId('Bearerveeva-vault-token123')).toBe('Bearer veeva-vault-token123');
        expect(formatSessionId('bearerveeva-vault-token123')).toBe('Bearer veeva-vault-token123');
    });

    it('normalizes Bearer prefix to exact casing and single space if input is correct but mis-cased or spaced', () => {
        expect(formatSessionId('Bearer veeva-vault-token123')).toBe('Bearer veeva-vault-token123');
        expect(formatSessionId('bearer veeva-vault-token123')).toBe('Bearer veeva-vault-token123');
        expect(formatSessionId('bearer  veeva-vault-token123')).toBe('Bearer veeva-vault-token123');
    });

    it('handles uppercase token markers correctly', () => {
        expect(formatSessionId('VEEVA-VAULT-token123')).toBe('Bearer VEEVA-VAULT-token123');
        expect(formatSessionId('Bearer VEEVA-VAULT-token123')).toBe('Bearer VEEVA-VAULT-token123');
        expect(formatSessionId('bearerVEEVA-VAULT-token123')).toBe('Bearer VEEVA-VAULT-token123');
    });
});

describe('Encryption & Decryption (Discussion 6, Discussion 16 base)', () => {
    it('successfully encrypts and decrypts secret text', () => {
        const secret = "SuperSecretVaultPassword123!!";
        const encrypted = encrypt(secret);
        expect(encrypted).toContain(':');
        
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(secret);
    });

    it('throws error or fails gracefully on bad decrypt inputs', () => {
        expect(() => decrypt('bad_input')).toThrow();
    });
});

describe('API Version Cache & Expiration (Discussion 15)', () => {
    let mockConfigData = null;

    beforeEach(() => {
        mockConfigData = null;
        resetVersionCache(); // Clear the cache before each test to maintain test isolation
        
        vi.spyOn(fs, 'existsSync').mockImplementation((p) => {
            if (p === ENV_PATH) return mockConfigData !== null;
            return originalExistsSync(p);
        });

        vi.spyOn(fs, 'readFileSync').mockImplementation((p, options) => {
            if (p === ENV_PATH && mockConfigData !== null) {
                return encrypt(JSON.stringify(mockConfigData));
            }
            return originalReadFileSync(p, options);
        });

        vi.spyOn(fs, 'writeFileSync').mockImplementation((p, content, options) => {
            if (p === ENV_PATH) {
                // Parse and update mockConfigData so subsequent reads see the updated data
                try {
                    mockConfigData = JSON.parse(decrypt(content));
                } catch {
                    // Suppress and ignore parsing errors for non-matching configs
                }
                return;
            }
            return originalWriteFileSync(p, content, options);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('considers stored version valid if storedDate is fresh (within 1 month)', async () => {
        const freshDate = new Date();
        freshDate.setDate(freshDate.getDate() - 15); // 15 days ago (fresh!)

        mockConfigData = {
            vaultUrl: 'https://test.veevavault.com',
            apiVersion: 'v26.1',
            apiVersionDate: freshDate.toISOString()
        };

        const resolved = await resolveApiVersion();
        expect(resolved).toBe('v26.1');
    });

    it('ignores stored version if storedDate is expired (older than 1 month)', async () => {
        const expiredDate = new Date();
        expiredDate.setMonth(expiredDate.getMonth() - 2); // 2 months ago (expired!)

        mockConfigData = {
            vaultUrl: 'https://test.veevavault.com',
            apiVersion: 'v26.1',
            apiVersionDate: expiredDate.toISOString()
        };

        // Mock network request to discover new version
        const mockResponse = {
            responseStatus: 'SUCCESS',
            values: {
                'v26.1': {},
                'v26.2': {}
            }
        };

        vi.spyOn(https, 'request').mockImplementation((url, options, callback) => {
            const mockRes = {
                on: (event, handler) => {
                    if (event === 'data') {
                        handler(Buffer.from(JSON.stringify(mockResponse)));
                    }
                    if (event === 'end') {
                        handler();
                    }
                }
            };
            callback(mockRes);
            return {
                on: () => {},
                write: () => {},
                end: () => {}
            };
        });

        const resolved = await resolveApiVersion();
        // Should discover latest version ('v26.2' since values has both and pickLatestVersion returns v26.2)
        expect(resolved).toBe('v26.2');
    });
});

describe('Job Polling & Maximum Attempts (Discussion 17)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetVersionCache(); // Maintain test isolation

        // Stub config read
        vi.spyOn(fs, 'existsSync').mockImplementation((p) => {
            if (p === ENV_PATH) return true;
            return originalExistsSync(p);
        });

        vi.spyOn(fs, 'readFileSync').mockImplementation((p, options) => {
            if (p === ENV_PATH) {
                return encrypt(JSON.stringify({
                    vaultUrl: 'https://test.veevavault.com',
                    apiVersion: 'v26.1',
                    sessionId: 'mock-session-id' // Avoid triggering login sequence during fetch
                }));
            }
            return originalReadFileSync(p, options);
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('returns immediately if wait is false', async () => {
        vi.spyOn(https, 'request').mockImplementation((url, options, callback) => {
            const mockRes = {
                on: (event, handler) => {
                    if (event === 'data') {
                        handler(Buffer.from(JSON.stringify({ data: { status: 'IN_PROGRESS' } })));
                    }
                    if (event === 'end') {
                        handler();
                    }
                }
            };
            callback(mockRes);
            return {
                on: () => {},
                write: () => {},
                end: () => {}
            };
        });

        const promise = pollJob('12345', { wait: false });
        const result = await promise;
        expect(result.status).toBe('IN_PROGRESS');
    });

    it('respects MAX_POLL_ATTEMPTS and returns TIMEOUT status if stuck forever', async () => {
        // Stub request returning IN_PROGRESS always
        vi.spyOn(https, 'request').mockImplementation((url, options, callback) => {
            const mockRes = {
                on: (event, handler) => {
                    if (event === 'data') {
                        handler(Buffer.from(JSON.stringify({ data: { status: 'IN_PROGRESS' } })));
                    }
                    if (event === 'end') {
                        handler();
                    }
                }
            };
            callback(mockRes);
            return {
                on: () => {},
                write: () => {},
                end: () => {}
            };
        });

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const promise = pollJob('12345', { wait: true });
        
        // Fast-forward timers multiple times to run the polling loop
        for (let i = 0; i < 110; i++) {
            await vi.advanceTimersByTimeAsync(12000);
        }

        const result = await promise;
        expect(result.status).toBe('TIMEOUT');
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Maximum poll attempts reached'));
    });
});
