/** Pure predicates for Vault API response shapes used by the ERD Explorer data layer. */

export function isFailure(resp: unknown): boolean {
    // Per vault-api-integration: only FAILURE is an error; WARNING/SUCCESS both carry valid data.
    return (resp as { responseStatus?: string } | undefined)?.responseStatus === 'FAILURE';
}

export function firstErrorMessage(resp: unknown, fallback: string): string {
    const errors = (resp as { errors?: Array<{ message?: string }> } | undefined)?.errors;
    return errors?.[0]?.message ?? fallback;
}

/** Vault returns type INVALID_SESSION_ID when the login has expired — those errors are recoverable. */
export function isSessionExpired(resp: unknown): boolean {
    const errors = (resp as { errors?: Array<{ type?: string }> } | undefined)?.errors;
    return errors?.[0]?.type === 'INVALID_SESSION_ID';
}

/**
 * Error types Vault uses when the signed-in user lacks the permission an endpoint requires. Deliberately
 * narrow: a request Vault merely rejected must not be reported to the user as missing Admin access.
 */
const ACCESS_DENIED_ERROR_TYPES: ReadonlySet<string> = new Set([
    'INSUFFICIENT_ACCESS',
    'INSUFFICIENT_PERMISSIONS',
]);

/** True when a failure looks like a permissions problem rather than a bad request or an outage. */
export function isAccessDenied(resp: unknown): boolean {
    const errors = (resp as { errors?: Array<{ type?: string }> } | undefined)?.errors;
    return ACCESS_DENIED_ERROR_TYPES.has(errors?.[0]?.type ?? '');
}
