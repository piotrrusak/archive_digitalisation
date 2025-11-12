import psutil

try:
    import pynvml
except ImportError as exc:
    raise SystemExit("Missing module pynvml. Install it with: pip install nvidia-ml-py3") from exc


def human_readable_bytes(num_bytes):
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if num_bytes < 1024:
            return f"{num_bytes:.2f} {unit}"
        num_bytes /= 1024
    return f"{num_bytes:.2f} PB"


def main():
    ram = psutil.virtual_memory()
    print(
        f"Free RAM: {human_readable_bytes(ram.available)} out of {human_readable_bytes(ram.total)}"
    )

    pynvml.nvmlInit()
    gpu_count = pynvml.nvmlDeviceGetCount()
    if gpu_count == 0:
        print("No NVIDIA GPUs detected by NVML.")
        return

    for idx in range(gpu_count):
        handle = pynvml.nvmlDeviceGetHandleByIndex(idx)
        name = pynvml.nvmlDeviceGetName(handle).decode()
        mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
        print(
            f"GPU {idx} ({name}): "
            f"{human_readable_bytes(mem_info.free)} "
            f"out of {human_readable_bytes(mem_info.total)} free"
        )

    pynvml.nvmlShutdown()


if __name__ == "__main__":
    main()
