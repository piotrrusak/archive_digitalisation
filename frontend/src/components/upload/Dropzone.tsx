import React, { useCallback, useRef, useState } from "react";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "../../config/upload";

interface DropzoneProps {
    onFileSelected: (file: File) => void;
    disabled?: boolean;
    accept?: string[];
    maxSizeBytes?: number;
    multiple?: boolean;
    className?: string;
}

function normalizeAcceptList(list: string[] | undefined): string[] {
    if (!list || list.length === 0) return [];
    return Array.from(new Set(list.map(s => s.trim()).filter(Boolean)));
}

function getExt(name: string): string {
    const dot = name.lastIndexOf(".");
    return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function isAccepted(file: File, acceptList: string[]): boolean {
    if (acceptList.length === 0) return true;
    const ext = getExt(file.name);
    const mime = file.type.toLowerCase();
    for (const rule of acceptList) {
        const r = rule.toLowerCase();
        if (r.startsWith(".")) {
            if (ext === r) return true;
        } else {
            if (r.endsWith("/*")) {
                const prefix = r.replace("/*", "");
                if (mime.startsWith(prefix)) return true;
            } else if (mime === r) {
                return true;
            }
        }
    }
    return false;
}

const Dropzone: React.FC<DropzoneProps> = ({
    onFileSelected,
    disabled = false,
    accept,
    maxSizeBytes,
    multiple = false,
    className = "",
}) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isOver, setIsOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const effectiveAccept = normalizeAcceptList(accept ?? ACCEPTED_MIME_TYPES);
    const effectiveMaxSize = maxSizeBytes ?? MAX_FILE_SIZE_BYTES;

    const describeAcceptAttr = effectiveAccept.join(",");

    const validateAndEmit = useCallback(
        (file: File | null) => {
            if (!file) return;

            setError(null);

            if (file.size > effectiveMaxSize) {
                const mb = (effectiveMaxSize / (1024 * 1024)).toFixed(1);
                setError(`File is too large. Maximum size is ${mb} MB.`);
                return;
            }

            if (!isAccepted(file, effectiveAccept)) {
                setError(
                    `Unsupported file type. Allowed: ${effectiveAccept.join(", ")}`
                );
                return;
            }

            onFileSelected(file);
        },
        [effectiveAccept, effectiveMaxSize, onFileSelected]
    );

    const onInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0] ?? null;
            validateAndEmit(f);
            if (inputRef.current) inputRef.current.value = "";
        },
        [validateAndEmit]
    );

    const onDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            if (disabled) return;
            e.preventDefault();
            e.stopPropagation();
            setIsOver(false);

            const fileList = e.dataTransfer.files;
            const f = fileList.length > 0 ? fileList[0] : null;
            validateAndEmit(f);
        },
        [disabled, validateAndEmit]
    );

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsOver(true);
    }, [disabled]);

    const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
    }, [disabled]);

    const openFileDialog = useCallback(() => {
        if (disabled) return;
        inputRef.current?.click();
    }, [disabled]);

    return (
        <div className={className}>
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={openFileDialog}
                role="button"
                aria-disabled={disabled}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openFileDialog();
                    }
                }}
                className={[
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition",
                    isOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
                    disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                ].join(" ")}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={describeAcceptAttr}
                    multiple={multiple}
                    onChange={onInputChange}
                    className="hidden"
                    disabled={disabled}
                />
                <div className="flex flex-col items-center gap-2">
                    <span className="font-medium">
                        Drag and drop a file here
                    </span>
                    <span className="text-sm text-gray-600">or click to select from disk</span>
                    {effectiveAccept.length > 0 && (
                        <span className="text-xs text-gray-500">
                            Allowed: {effectiveAccept.join(", ")}
                        </span>
                    )}
                    {effectiveMaxSize > 0 && (
                        <span className="text-xs text-gray-500">
                            Max. size: {(effectiveMaxSize / (1024 * 1024)).toFixed(1)} MB
                        </span>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-2 text-sm text-red-600">
                    {error}
                </div>
            )}
        </div>
    );
};

export default Dropzone;
