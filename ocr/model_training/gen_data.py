import os
import json
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DATA_DIR = os.path.join(SCRIPT_DIR, 'data')
OUTPUT_FILE_PATH = os.path.join(SCRIPT_DIR, 'input', 'dataset.json')
DATA_DIR = os.path.join(SCRIPT_DIR, 'dataset')

os.makedirs(OUTPUT_DATA_DIR, exist_ok=True)

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp', '.tif', '.tiff'}


def collect_image_files(root_dir) :
    paths = []
    for root, _, files in os.walk(root_dir) :
        for fname in files :
            if os.path.splitext(fname)[1].lower() in IMAGE_EXTS :
                paths.append(os.path.join(root, fname))
    paths.sort()
    return paths


class ImageAnnotator :

    HANDLE_SIZE = 6
    HANDLE_HIT = 8

    def __init__(self, master, image_paths, start_index, output_file_path=OUTPUT_FILE_PATH) :
        self.master = master
        self.master.title("Image annotator — Shift+Enter submit, Enter add line, drag to edit")
        self.image_paths = image_paths
        self.current_pos = start_index
        self.current_image_path = ""
        self.output_file_path = output_file_path

        self._orig_img = None
        self._render_photo = None
        self._render_size = (0, 0)
        self._render_offset = (0, 0)

        self._clicks = []
        self._sel_rect = None
        self._rect_id = None
        self._handle_ids = []
        self._drag_mode = None
        self._drag_start = None

        self._lines = []

        self.master.geometry("1400x900")
        self.master.minsize(1000, 600)

        main_frame = ttk.Frame(self.master, padding=10)
        main_frame.pack(fill="both", expand=True)

        left_frame = ttk.Frame(main_frame)
        left_frame.pack(side="left", fill="both", expand=True)

        self.path_var = tk.StringVar()
        self.path_label = ttk.Label(left_frame, textvariable=self.path_var, font=("TkDefaultFont", 10))
        self.path_label.pack(anchor="w", pady=(0, 6))

        self.canvas = tk.Canvas(left_frame, bg="#ddd")
        self.canvas.pack(fill="both", expand=True)

        right_frame = ttk.Frame(main_frame, width=420)
        right_frame.pack(side="right", fill="y", padx=(15, 0))

        self.text = tk.Text(right_frame, height=10, wrap="word", state="disabled")
        self.text.pack(fill="both", expand=True, pady=(0, 4))

        self.hint_var = tk.StringVar(value=(
            '''Instruction:
            • Click 2× to create rectangle. After the first click, the rect follows the cursor.
            • Grab the edge/corner (or center) to resize/move.
            • Enter — add a line; Shift+Enter — save the image; ESC — cancel selection.'''
        ))
        ttk.Label(right_frame, textvariable=self.hint_var, foreground="#555").pack(anchor="w", pady=(0, 6))

        self.canvas.bind("<Configure>", self._on_canvas_resize)
        self.canvas.bind("<Button-1>", self._on_canvas_click)
        self.canvas.bind("<B1-Motion>", self._on_canvas_drag)
        self.canvas.bind("<ButtonRelease-1>", self._on_canvas_release)
        self.canvas.bind("<Motion>", self._on_canvas_motion)
        self.master.bind("<Escape>", self._on_escape)
        self.text.bind("<Return>", self._on_text_enter)
        self.text.bind("<Shift-Return>", self._on_submit)

        os.makedirs(os.path.dirname(self.output_file_path), exist_ok=True)
        if not os.path.exists(self.output_file_path):
            with open(self.output_file_path, "w", encoding="utf-8") as f:
                json.dump([], f)

        self._load_current()

    def _fit_image(self, ow, oh, avail_w, avail_h) :
        if avail_w <= 0 or avail_h <= 0 :
            return 0, 0
        img_ratio = ow / max(1, oh)
        panel_ratio = avail_w / max(1, avail_h)
        if img_ratio > panel_ratio :
            new_w = avail_w
            new_h = int(new_w / img_ratio)
        else :
            new_h = avail_h
            new_w = int(new_h * img_ratio)
        return max(new_w, 1), max(new_h, 1)

    def _display_image(self) :
        if self._orig_img is None :
            return
        cw = max(self.canvas.winfo_width(), 1)
        ch = max(self.canvas.winfo_height(), 1)
        ow, oh = self._orig_img.size
        new_w, new_h = self._fit_image(ow, oh, cw, ch)
        self._render_size = (new_w, new_h)
        off_x = (cw - new_w) // 2
        off_y = (ch - new_h) // 2
        self._render_offset = (off_x, off_y)
        resized = self._orig_img.resize((new_w, new_h), Image.LANCZOS)
        self._render_photo = ImageTk.PhotoImage(resized)
        self.canvas.delete("all")
        self.canvas.create_image(off_x, off_y, image=self._render_photo, anchor="nw", tags=("img",))
        for ln in self._lines :
            x1, y1, x2, y2 = ln['bbox']
            dx1, dy1 = self._orig_to_disp(x1, y1)
            dx2, dy2 = self._orig_to_disp(x2, y2)
            self._draw_selection(dx1, dy1, dx2, dy2)
        
        if self._sel_rect is not None :
            x1, y1, x2, y2 = self._sel_rect
            self._draw_selection(x1, y1, x2, y2)
        else :
            self._rect_id = None
        self._clicks = []

    def _on_canvas_resize(self, _) :
        self._display_image()

    def _orig_to_disp(self, x, y) :
        ow, oh = self._orig_img.size
        rw, rh = self._render_size
        off_x, off_y = self._render_offset
        sx = rw / ow
        sy = rh / oh
        return int(off_x + x * sx), int(off_y + y * sy)

    def _disp_to_orig(self, x, y) :
        ow, oh = self._orig_img.size
        rw, rh = self._render_size
        off_x, off_y = self._render_offset
        rx = max(0, min(rw, x - off_x))
        ry = max(0, min(rh, y - off_y))
        sx = ow / max(1, rw)
        sy = oh / max(1, rh)
        return int(rx * sx), int(ry * sy)

    
    def _constrain_to_image(self, x, y) :
        off_x, off_y = self._render_offset
        rw, rh = self._render_size
        x = max(off_x, min(off_x + rw, x))
        y = max(off_y, min(off_y + rh, y))
        return x, y

    def _draw_selection(self, x1, y1, x2, y2) :
        x1, x2 = sorted((x1, x2))
        y1, y2 = sorted((y1, y2))
        x1, y1 = self._constrain_to_image(x1, y1)
        x2, y2 = self._constrain_to_image(x2, y2)
        if self._rect_id is not None :
            self.canvas.delete(self._rect_id)
        self._rect_id = self.canvas.create_rectangle(
            x1, y1, x2, y2,
            outline="#1e90ff", width=2, fill="#1e90ff", stipple="gray25"
        )
        
        for hid in self._handle_ids :
            self.canvas.delete(hid)
        self._handle_ids = []
        for hx, hy in ((x1, y1), (x2, y1), (x1, y2), (x2, y2)) :
            hid = self.canvas.create_rectangle(
                hx - self.HANDLE_SIZE, hy - self.HANDLE_SIZE,
                hx + self.HANDLE_SIZE, hy + self.HANDLE_SIZE,
                outline="#1e90ff", fill="#f0f8ff"
            )
            self._handle_ids.append(hid)
        self._sel_rect = [x1, y1, x2, y2]

    def _start_rubber_band(self, x, y) :
        self._clicks = [(x, y)]
        self.canvas.delete("temp_rect")
        
        rect_id = self.canvas.create_rectangle(
            x, y, x+1, y+1,
            outline="#1e90ff", width=2, dash=(4, 2), tags=("temp_rect",)
        )
        return rect_id

    def _on_canvas_motion(self, event) :
        
        if len(self._clicks) == 1 and self._orig_img is not None :
            x1, y1 = self._clicks[0]
            x2, y2 = self._constrain_to_image(event.x, event.y)
            self.canvas.coords("temp_rect", x1, y1, x2, y2)
        elif self._sel_rect is not None :
            x1, y1, x2, y2 = self._sel_rect
            mode = self._hit_test(event.x, event.y, x1, y1, x2, y2)
            cursor = {
                'tl': 'top_left_corner', 'tr': 'top_right_corner',
                'bl': 'bottom_left_corner', 'br': 'bottom_right_corner',
                'move': 'fleur', None: ''
            }.get(mode, '')
            self.canvas.configure(cursor=cursor)

    def _on_canvas_click(self, event) :
        if self._orig_img is None :
            return
        off_x, off_y = self._render_offset
        rw, rh = self._render_size
        if not (off_x <= event.x <= off_x + rw and off_y <= event.y <= off_y + rh) :
            return

        if self._sel_rect is not None :
            x1, y1, x2, y2 = self._sel_rect
            mode = self._hit_test(event.x, event.y, x1, y1, x2, y2)
            if mode :
                self._drag_mode = mode
                self._drag_start = (event.x, event.y)
                return

        if len(self._clicks) == 0 :
            self._start_rubber_band(event.x, event.y)
        elif len(self._clicks) == 1 :
            x1, y1 = self._clicks[0]
            x2, y2 = self._constrain_to_image(event.x, event.y)
            self.canvas.delete("temp_rect")
            self._draw_selection(x1, y1, x2, y2)
            self.text.config(state="normal")
            self.text.delete("1.0", "end")
            self.text.focus_set()
            self._clicks = []

    def _on_canvas_drag(self, event) :
        if self._sel_rect is None or self._drag_mode is None :
            return
        x1, y1, x2, y2 = self._sel_rect
        ex, ey = self._constrain_to_image(event.x, event.y)
        if self._drag_mode == 'move' :
            sx, sy = self._drag_start
            dx, dy = ex - sx, ey - sy
            self._drag_start = (ex, ey)
            self._draw_selection(x1 + dx, y1 + dy, x2 + dx, y2 + dy)
        else :
            if 't' in self._drag_mode :
                y1 = ey
            if 'b' in self._drag_mode :
                y2 = ey
            if 'l' in self._drag_mode :
                x1 = ex
            if 'r' in self._drag_mode :
                x2 = ex
            self._draw_selection(x1, y1, x2, y2)

    def _on_canvas_release(self, _event) :
        self._drag_mode = None
        self._drag_start = None

    def _hit_test(self, x, y, x1, y1, x2, y2) :
        x1, x2 = sorted((x1, x2))
        y1, y2 = sorted((y1, y2))
        h = self.HANDLE_HIT
        corners = {
            'tl': (x1, y1), 'tr': (x2, y1), 'bl': (x1, y2), 'br': (x2, y2)
        }
        for name, (hx, hy) in corners.items() :
            if abs(x - hx) <= h and abs(y - hy) <= h :
                return name
        if x1 + h < x < x2 - h and y1 + h < y < y2 - h :
            return 'move'
        return None

    def _on_escape(self, _) :
        if self._rect_id is not None :
            self.canvas.delete(self._rect_id)
            self._rect_id = None
        for hid in self._handle_ids :
            self.canvas.delete(hid)
        self._handle_ids = []
        self.canvas.delete("temp_rect")
        self._sel_rect = None
        self._clicks = []
        self.text.delete("1.0", "end")
        self.text.config(state="disabled")

    def _on_text_enter(self, event) :
        if self._sel_rect is None :
            return "break"
        text = self.text.get("1.0", "end").strip()
        x1d, y1d, x2d, y2d = self._sel_rect
        x1o, y1o = self._disp_to_orig(x1d, y1d)
        x2o, y2o = self._disp_to_orig(x2d, y2d)
        x1o, x2o = sorted((x1o, x2o))
        y1o, y2o = sorted((y1o, y2o))
        self._lines.append({"bbox": [x1o, y1o, x2o, y2o], "text": text})

        self.text.delete("1.0", "end")
        self.text.config(state="disabled")
        self._sel_rect = None
        self._clicks = []
        self._rect_id = None
        for hid in self._handle_ids :
            self.canvas.delete(hid)
        self._handle_ids = []
        self._display_image()
        return "break"

    def _save_image_record(self) :
        name = f"{self.current_pos:04d}"
        rel_filepath = f"data/{name}.png"
        abs_filepath = os.path.join(SCRIPT_DIR, rel_filepath)
        os.makedirs(os.path.dirname(abs_filepath), exist_ok=True)

        try :
            img = Image.open(self.current_image_path)
            img.save(abs_filepath)
        except Exception as e :
            messagebox.showerror("Error", f"Failed to save image copy {e}")
            return False

        try :
            with open(self.output_file_path, "r", encoding="utf-8") as f :
                dataset = json.load(f)
                if not isinstance(dataset, list) :
                    dataset = []
        except Exception as e :
            dataset = []

        record = {"filepath": rel_filepath, "name": name, "lines": self._lines}
        dataset.append(record)
        try :
            with open(self.output_file_path, "w", encoding="utf-8") as f :
                json.dump(dataset, f, ensure_ascii=False, indent=2)
        except Exception as e :
            messagebox.showerror("Error", f"Failed to write JSON: {e}")
            return False
        print(f"Saved record {name} with {len(self._lines)} line(s)")
        return True

    def _on_submit(self, _event) :
        try :
            self._on_text_enter(None)
        except Exception as e :
            messagebox.showerror("Error", f"Failed to commit current line:\n{e}")
            return "break"
        
        if not self._save_image_record() :
            return "break"
        self._goto_next_image()
        return "break"

    def _goto_next_image(self) :
        self.current_pos += 2
        if self.current_pos >= len(self.image_paths) :
            messagebox.showinfo("Done", "Reached the end of the dataset.")
            self.master.after(100, self.master.destroy)
        else :
            self._load_current()

    def _load_current(self) :
        self.current_image_path = self.image_paths[self.current_pos]
        self.path_var.set(self.current_image_path)
        try :
            self._orig_img = Image.open(self.current_image_path).convert("RGBA")
        except Exception as e :
            self._orig_img = Image.new("RGBA", (800, 600), (220, 220, 220, 255))
            messagebox.showwarning("Warning", f"Cannot open image: {e}")
        self._lines = []
        self._clicks = []
        self._rect_id = None
        self._sel_rect = None
        for hid in self._handle_ids :
            self.canvas.delete(hid)
        self._handle_ids = []
        self.text.delete("1.0", "end")
        self.text.config(state="disabled")
        self.master.after(10, self._display_image)


def main() :
    all_files = collect_image_files(DATA_DIR)
    print(f"Collected {len(all_files)} image files from dataset.")

    os.makedirs(os.path.dirname(OUTPUT_FILE_PATH), exist_ok=True)
    if not os.path.exists(OUTPUT_FILE_PATH) :
        with open(OUTPUT_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump([], f)

    try :
        with open(OUTPUT_FILE_PATH, "r", encoding="utf-8") as f :
            dataset = json.load(f)
            last_record_number = int(dataset[-1]['name']) if dataset else -1
    except Exception :
        last_record_number = -1

    even_data = True
    start_index = last_record_number + (1 if even_data != (last_record_number % 2 == 0) else 2)
    print(f"Last record number: {last_record_number}, starting from index: {start_index}")

    root = tk.Tk()
    ImageAnnotator(root, all_files, start_index)
    root.mainloop()


if __name__ == "__main__" :
    main()
