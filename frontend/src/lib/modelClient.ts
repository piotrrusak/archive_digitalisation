type Dict = Record<string, unknown>;

export interface StoredFileRequest {
    filename: string;
    content_type: string;
    byte_size: number;
    file_base64: string;
    metadata?: Record<string, string | number | boolean | null>;
}

export type StoredFileResponse = Dict;

let AUTH_TOKEN: string | null = null;

export function setAuthToken(token: string | null) {
    AUTH_TOKEN = token;
}

export function getApiBaseUrl(): string {
    const base = import.meta.env.VITE_REST_API_BASE_URL as string | undefined;
    if (!base) {
        throw new Error(
            "No VITE_REST_API_BASE_URL in env. Set e.g. VITE_REST_API_BASE_URL=http://localhost:8080/api/v1"
        );
    }
    return base.replace(/\/+$/, "");
}

function inferContentType(file: File): string {
    if (file.type) return file.type;

    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    switch (ext) {
        case "png":
            return "image/png";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "gif":
            return "image/gif";
        case "webp":
            return "image/webp";
        case "tif":
        case "tiff":
            return "image/tiff";
        case "pdf":
            return "application/pdf";
        case "bmp":
            return "image/bmp";
        case "heic":
            return "image/heic";
        default:
            return "application/octet-stream";
    }
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => { reject(new Error("Failed to read file")); };
        reader.onload = () => {
            const result = reader.result as string;
            const comma = result.indexOf(",");
            if (comma === -1) {
                reject(new Error("Invalid base64 data format"));
                return;
            }
            resolve(result.slice(comma + 1));
        };
        reader.readAsDataURL(file);
    });
}

function withTimeout<T>(promise: Promise<T>, ms = 30000): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => { controller.abort(); }, ms);

    return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            setTimeout(() => { reject(new Error("Request timed out")); }, ms);
        }),
    ]).finally(() => { clearTimeout(timeout); });
}

async function postJson<T>(
    url: string,
    body: unknown,
    { timeoutMs = 30000 }: { timeoutMs?: number } = {}
): Promise<T> {
    const headers = new Headers({
        "Content-Type": "application/json",
    });
    if (AUTH_TOKEN) {
        headers.set("Authorization", `Bearer ${AUTH_TOKEN}`);
    }

    const fetchPromise = fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });

    const res = await withTimeout(fetchPromise, timeoutMs);

    let payload: unknown = null;
    const text = await res.text().catch(() => "");
    try {
        payload = text ? JSON.parse(text) : null;
    } catch {
        payload = text;
    }

    if (!res.ok) {
        let message: string | null = null;
        if (payload && typeof payload === "object") {
            const p = payload as Record<string, unknown>;
            if (typeof p.message === "string") message = p.message;
            else if (typeof p.error === "string") message = p.error;
            else if (typeof p.detail === "string") message = p.detail;
        }
        const finalMessage = message ?? `HTTP Error ${String(res.status)}`;
        const err = new Error(finalMessage) as Error & { status?: number; data?: unknown };
        err.status = res.status;
        err.data = payload;
        throw err;
    }

    return payload as T;
}

export async function uploadStoredFile(
    file: File,
    metadata?: Record<string, string | number | boolean | null>
): Promise<StoredFileResponse> {
    const [apiBase, file_base64] = await Promise.all([
        Promise.resolve(getApiBaseUrl()),
        fileToBase64(file),
    ]);

    const payload: StoredFileRequest = {
        filename: file.name,
        content_type: inferContentType(file),
        byte_size: file.size,
        file_base64,
        ...(metadata ? { metadata } : {}),
    };

    const url = `${apiBase}/stored_files`;
    return await postJson<StoredFileResponse>(url, payload, { timeoutMs: 30000 });
}
