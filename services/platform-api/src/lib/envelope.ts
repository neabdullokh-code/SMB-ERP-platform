export function ok<T>(data: T, meta?: Record<string, unknown>) {
    return { data, meta: meta ?? null, error: null };
}

export function paginated<T>(data: T[], page: number, pageSize: number, total: number) {
    return { data, meta: { page, pageSize, total }, error: null };
}

export function fail(message: string, errorCode?: string) {
    return { data: null, meta: null, error: { message, errorCode: errorCode ?? null } };
}
