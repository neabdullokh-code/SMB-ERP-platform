export function ok<T>(data: T, meta?: Record<string, unknown>) {
    return { data, meta: meta ?? null, error: null };
}

export function paginated<T>(data: T[], page: number, pageSize: number, total: number) {
    return { data, meta: { page, pageSize, total }, error: null };
}

export function fail(message: string, errorCode?: string, details?: unknown) {
    return {
        data: null,
        meta: null,
        error: {
            message,
            errorCode: errorCode ?? null,
            details: details ?? null
        }
    };
}

/**
 * Structured document-posting error. Thrown from posting services when business
 * rules (such as insufficient stock) reject a document. Carries per-line detail
 * so the UI can highlight individual rows.
 */
export class DocumentPostingError extends Error {
    readonly httpStatus: number;
    readonly errorCode: string;
    readonly details: unknown;

    constructor(params: {
        message: string;
        errorCode: string;
        httpStatus?: number;
        details?: unknown;
    }) {
        super(params.message);
        this.name = "DocumentPostingError";
        this.errorCode = params.errorCode;
        this.httpStatus = params.httpStatus ?? 400;
        this.details = params.details ?? null;
    }
}

export function isDocumentPostingError(value: unknown): value is DocumentPostingError {
    if (value instanceof DocumentPostingError) return true;
    if (!value || typeof value !== "object") return false;
    const e = value as Record<string, unknown>;
    return e.name === "DocumentPostingError"
        && typeof e.errorCode === "string"
        && typeof e.httpStatus === "number"
        && typeof e.message === "string";
}
