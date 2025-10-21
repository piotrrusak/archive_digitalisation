import os
import json
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DATA_DIR = os.path.join(SCRIPT_DIR, 'data')
OUTPUT_FILE_PATH = os.path.join(SCRIPT_DIR, 'input', 'dataset.json')
PREVIOUSLY_GENERATED = 30


DATA_DIR = os.path.join(SCRIPT_DIR, 'dataset')

os.makedirs(OUTPUT_DATA_DIR, exist_ok=True)


def collect_image_files(root_dir) :
    image_exts = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp', '.tif', '.tiff'}
    paths = []
    for root, _, files in os.walk(root_dir) :
        for fname in files :
            if os.path.splitext(fname)[1].lower() in image_exts :
                paths.append(os.path.join(root, fname))
    paths.sort()
    return paths

class ImageAnnotator :
    def __init__(self, master, image_paths, start_index, output_file_path = OUTPUT_FILE_PATH) :
        self.master = master
        self.master.title("Image annotator — Shift+Enter to submit")
        self.image_paths = image_paths
        self.step = 2
        self.current_pos = start_index
        self.current_image_path = ""
        self.output_file_path = output_file_path

        self._orig_img = None
        self._tk_img = None
        self._resize_job_fast = None
        self._resize_job_final = None
        self._last_draw_size = (0, 0)

        self.master.geometry("1400x900")
        self.master.minsize(1000, 600)

        main_frame = ttk.Frame(self.master, padding = 10)
        main_frame.pack(fill="both", expand=True)

        left_frame = ttk.Frame(main_frame)
        left_frame.pack(side = "left", fill = "both", expand = True)

        self.path_var = tk.StringVar()
        self.path_label = ttk.Label(left_frame, textvariable = self.path_var, font = ("TkDefaultFont", 10))
        self.path_label.pack(anchor = "w", pady = (0, 6))

        self.image_panel = ttk.Label(left_frame, anchor = "center")
        self.image_panel.pack(fill = "both", expand = True)

        right_frame = ttk.Frame(main_frame, width = 400)
        right_frame.pack(side = "right", fill = "y", padx = (15, 0))

        self.text = tk.Text(right_frame, height = 20, wrap = "word")
        self.text.pack(fill = "both", expand = True, pady = (0, 4))

        hint = ttk.Label(right_frame, text = "Hint: Shift+Enter = submit\nEnter = newline", foreground = "#666")
        hint.pack(anchor = "w", pady = (0, 6))

        self.text.bind("<Shift-Return>", self.on_submit)

        self.image_panel.bind("<Configure>", self._on_panel_resize)

        self._tk_img = None
        self._load_current()

    def _load_current(self) :
        self.current_image_path = self.image_paths[self.current_pos]
        try :
            self._orig_img = Image.open(self.current_image_path).convert("RGBA")
        except Exception as e :
            self._orig_img = Image.new("RGBA", (800, 600), (220, 220, 220, 255))
            messagebox.showwarning("Warning", f"Cannot open image:\n{e}")

        self._last_draw_size = (0, 0)
        self._display_image_fast()
        self.text.delete("1.0", "end")
        self.text.focus_set()

    def _display_image(self, path: str) :
        try :
            img = Image.open(path)
        except Exception as e :
            ph = Image.new("RGB", (800, 600), color = (220, 220, 220))
            self._tk_img = ImageTk.PhotoImage(ph)
            self.image_panel.configure(image = self._tk_img, text = f"Cannot open image: {e}", compound = "center")
            return

        panel_width = max(self.image_panel.winfo_width(), 400)
        panel_height = max(self.master.winfo_height() - 100, 300)

        img_ratio = img.width / max(1, img.height)
        panel_ratio = panel_width / max(1, panel_height)

        if img_ratio > panel_ratio :
            new_w = panel_width
            new_h = int(new_w / img_ratio)
        else :
            new_h = panel_height
            new_w = int(new_h * img_ratio)

        if new_w > 0 and new_h > 0 :
            img = img.resize((new_w, new_h), Image.LANCZOS)

        self._tk_img = ImageTk.PhotoImage(img)
        self.image_panel.configure(image = self._tk_img, text = "", compound = None)

    def _on_resize(self, _) :
        if self.current_image_path :
            self._display_image(self.current_image_path)

    def _on_panel_resize(self, _) :
        if self._resize_job_fast is None :
            self._resize_job_fast = self.master.after(40, self._display_image_fast)
        if self._resize_job_final is not None :
            self.master.after_cancel(self._resize_job_final)
        self._resize_job_final = self.master.after(180, self._display_image_final)

    def _compute_fit_size(self) :
        if self._orig_img is None :
            return (0, 0)
        panel_width = max(self.image_panel.winfo_width(), 1)
        panel_height = max(self.image_panel.winfo_height(), 1)

        ow, oh = self._orig_img.size
        img_ratio = ow / max(1, oh)
        panel_ratio = panel_width / max(1, panel_height)

        if img_ratio > panel_ratio :
            new_w = panel_width
            new_h = int(new_w / img_ratio)
        else :
            new_h = panel_height
            new_w = int(new_h * img_ratio)

        return (max(new_w, 1), max(new_h, 1))

    def _should_redraw(self, new_size) :
        lw, lh = self._last_draw_size
        nw, nh = new_size
        return abs(nw - lw) >= 2 or abs(nh - lh) >= 2

    def _display_image_fast(self) :
        self._resize_job_fast = None
        if self._orig_img is None :
            return
        new_w, new_h = self._compute_fit_size()
        if not self._should_redraw((new_w, new_h)) :
            return
        preview = self._orig_img.resize((new_w, new_h), Image.BILINEAR)
        self._tk_img = ImageTk.PhotoImage(preview)
        self.image_panel.configure(image = self._tk_img, text = "", compound = None)
        self._last_draw_size = (new_w, new_h)

    def _display_image_final(self) :
        self._resize_job_final = None
        if self._orig_img is None :
            return
        new_w, new_h = self._compute_fit_size()
        sharp = self._orig_img.resize((new_w, new_h), Image.LANCZOS)
        self._tk_img = ImageTk.PhotoImage(sharp)
        self.image_panel.configure(image = self._tk_img, text = "", compound = None)
        self._last_draw_size = (new_w, new_h)

    def save_new_record(self, text) :
        name = f"{self.current_pos:04d}"
        filepath = f"data/{name}.png"
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        global_path = os.path.join(SCRIPT_DIR, filepath)
        try :
            img = Image.open(self.current_image_path)
            img.save(global_path)
        except Exception as e :
            messagebox.showerror("Error", f"Failed to save image:\n{e}")
            return "break"
        
        with open(self.output_file_path, "r", encoding = "utf-8") as f :
            dataset = json.load(f)
        
        new_record = {"filepath": filepath, "name": name, "text": text}
        dataset.append(new_record)

        with open(self.output_file_path, "w", encoding = "utf-8") as f :
            json.dump(dataset, f, ensure_ascii = False, indent = 2)

        print(f"Saved record {name} on path: {filepath}")

    def on_submit(self, _) :
        user_text = self.text.get("1.0", "end").rstrip("\n")
        self.save_new_record(user_text)

        self.current_pos += 2
        if self.current_pos >= len(self.image_paths) :
            self._flush_and_quit()
        else :
            self._load_current()
        return "break"

    def _flush_and_quit(self) :
        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)
        if not os.path.exists(self.output_file) :
            with open(self.output_file, "w", encoding = "utf-8") as f :
                json.dump([], f)

        try :
            with open(self.output_file, "r", encoding = "utf-8") as f :
                existing = json.load(f)
                if not isinstance(existing, list) :
                    existing = []
        except Exception :
            existing = []

        with open(self.output_file, "w", encoding = "utf-8") as f :
            json.dump(existing, f, ensure_ascii = False, indent = 2)

        messagebox.showinfo("Saved", f"Saved {len(self.results)} record(s) to:\n{self.output_file}")
        self.master.after(100, self.master.destroy)

def main() :
    all_files = collect_image_files(DATA_DIR)

    print(f"Collected {len(all_files)} image files from dataset.")

    if not os.path.exists(OUTPUT_FILE_PATH) :
        with open(OUTPUT_FILE_PATH, "w", encoding="utf-8") as f :
            json.dump([], f)

    with open(OUTPUT_FILE_PATH, "r", encoding="utf-8") as f :
        dataset = json.load(f)
        last_record_number = (int(dataset[-1]['name']) if dataset else 0)

    last_record_number = max(last_record_number, PREVIOUSLY_GENERATED)

    even_data = True

    start_index = last_record_number + (1 if even_data != (last_record_number % 2 == 0) else 2)
    print(f"Last record number: {last_record_number}, starting from index: {start_index}")

    root = tk.Tk()
    ImageAnnotator(root, all_files, start_index)
    root.mainloop()

if __name__ == "__main__" :

    main()
