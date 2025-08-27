export type UploadConfig = {
    acceptedExtensions: string[]; // e.g. ['pdf','png','jpg']
    maxFileSizeMB: number;        // e.g. 50
    multiple: boolean;            // for future; keep false now
};

const DEFAULTS: UploadConfig = {
    acceptedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'tiff', 'tif'],
    maxFileSizeMB: 50,
    multiple: false,
};

function parseExtList(input?: string): string[] | undefined {
    if (!input) return undefined;
    const arr = input
        .split(',')
        .map((e) => e.trim().toLowerCase().replace(/^\./, ''))
        .filter(Boolean);
    return arr.length ? Array.from(new Set(arr)) : undefined;
}

export function getUploadConfig(): UploadConfig {
    const envExt = parseExtList(import.meta.env.VITE_ALLOWED_EXTENSIONS as string | undefined);
    const maxFromEnv = Number(import.meta.env.VITE_MAX_UPLOAD_MB);
    return {
        acceptedExtensions: envExt ?? DEFAULTS.acceptedExtensions,
        maxFileSizeMB: Number.isFinite(maxFromEnv) && maxFromEnv > 0 ? maxFromEnv : DEFAULTS.maxFileSizeMB,
        multiple: DEFAULTS.multiple,
    };
}

export function extensionsToAcceptAttr(exts: string[]): string {
    return exts.map((e) => `.${e}`).join(',');
}

