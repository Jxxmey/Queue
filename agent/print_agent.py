import os
import threading
import time
import requests
import tkinter as tk
from tkinter import ttk, messagebox
import win32print
import win32ui
from pydantic import BaseModel
from datetime import datetime
from PIL import Image, ImageWin
import qrcode
import barcode
from barcode.writer import ImageWriter

class PrintJob(BaseModel):
    id: str
    queue_number: str
    service_type: str
    booking_number: str = None
    customer_phone: str = None
    queues_ahead: int = 0
    officer_name: str = "ระบบอัตโนมัติ"

# ฟังก์ชันตัวช่วย (QR / Barcode)
def generate_qrcode(data: str, filename: str):
    qr = qrcode.QRCode(version=1, box_size=6, border=1)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(filename)
    return filename

def generate_barcode(data: str, filename: str):
    code128 = barcode.get('code128', data, writer=ImageWriter())
    options = {'module_width': 0.3, 'module_height': 8.0, 'font_size': 8, 'text_distance': 3.0, 'quiet_zone': 1.0}
    code128.save(filename.replace('.png', ''), options=options)
    return filename

def execute_cut(hDC):
    try:
        CUT_COMMAND = b'\x1d\x56\x42\x00' 
        hDC.Escape(19, CUT_COMMAND) 
    except Exception as e:
        print(f"Cannot cut: {e}")

# ฟังก์ชันพิมพ์
def print_receipt(job: PrintJob, printer_name: str, frontend_url: str):
    try:
        hDC = win32ui.CreateDC()
        hDC.CreatePrinterDC(printer_name)
        
        hDC.StartDoc("Studio7_Queue_Ticket")
        hDC.StartPage()
        
        font_large = win32ui.CreateFont({"name": "Tahoma", "height": 80, "weight": 700})
        font_medium = win32ui.CreateFont({"name": "Tahoma", "height": 40, "weight": 700})
        font_normal = win32ui.CreateFont({"name": "Tahoma", "height": 28, "weight": 400})
        font_small = win32ui.CreateFont({"name": "Tahoma", "height": 22, "weight": 400})

        current_y = 20
        center_x = 280 

        def draw_text_center(text, font, y_offset):
            hDC.SelectObject(font)
            size = hDC.GetTextExtent(text)
            x_offset = center_x - (size[0] // 2)
            hDC.TextOut(x_offset, y_offset, text)
            return y_offset + size[1] + 10

        def draw_text_left(text, font, y_offset, x_offset=20):
            hDC.SelectObject(font)
            size = hDC.GetTextExtent(text)
            hDC.TextOut(x_offset, y_offset, text)
            return y_offset + size[1] + 5

        def draw_image_center(image_path, y_offset, target_width=200):
            try:
                img = Image.open(image_path)
                ratio = target_width / float(img.size[0])
                target_height = int((float(img.size[1]) * float(ratio)))
                img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
                dib = ImageWin.Dib(img)
                x_offset = center_x - (target_width // 2)
                dib.draw(hDC.GetHandleOutput(), (x_offset, y_offset, x_offset + target_width, y_offset + target_height))
                return y_offset + target_height + 20
            except Exception as e:
                return y_offset

        time_str = datetime.now().strftime("%d/%m/%Y %H:%M")
        service_text = "ซื้อหน้าร้าน (Walk-in)" if job.service_type == "walkin" else "รับสินค้าจอง (Pre-order)"

        # 1. ลูกค้า
        current_y = draw_text_center("STUDIO 7", font_medium, current_y)
        current_y = draw_text_center("บัตรคิวรับบริการ", font_normal, current_y)
        current_y += 10
        current_y = draw_text_center(job.queue_number, font_large, current_y)
        current_y = draw_text_center(f"ประเภท: {service_text}", font_normal, current_y)
        current_y += 10

        check_url = f"{frontend_url.strip('/')}/queue/{job.queue_number}"
        qr_file = generate_qrcode(check_url, "temp_qr.png")
        current_y = draw_image_center(qr_file, current_y, target_width=180)
        current_y = draw_text_center("สแกนเพื่อดูสถานะคิว", font_small, current_y)
        current_y += 20
        current_y = draw_text_center(f"คิวก่อนหน้า: {job.queues_ahead} คิว", font_medium, current_y)
        current_y = draw_text_center(f"เวลาออกบัตร: {time_str}", font_small, current_y)
        
        current_y += 120 
        execute_cut(hDC)
        current_y += 20

        # 2. พนักงาน
        current_y = draw_text_center("** ส่วนสำหรับพนักงาน **", font_normal, current_y)
        current_y += 10
        current_y = draw_text_left(f"คิว: {job.queue_number}", font_medium, current_y)
        current_y = draw_text_left(f"พนักงาน: {job.officer_name}", font_normal, current_y)
        current_y = draw_text_left(f"บริการ: {service_text}", font_normal, current_y)
        
        if job.customer_phone:
            current_y += 10
            current_y = draw_text_left(f"เบอร์ลูกค้า: {job.customer_phone}", font_normal, current_y)
            phone_bc = generate_barcode(job.customer_phone, "temp_phone_bc.png")
            current_y = draw_image_center(phone_bc, current_y, target_width=350)
        
        if job.service_type == "preorder" and job.booking_number:
            current_y += 10
            current_y = draw_text_left(f"เลขที่จอง: {job.booking_number}", font_normal, current_y)
            clean_booking = job.booking_number.replace("/", "-") 
            book_bc = generate_barcode(clean_booking, "temp_book_bc.png")
            current_y = draw_image_center(book_bc, current_y, target_width=400)

        current_y += 120
        execute_cut(hDC)

        hDC.EndPage()
        hDC.EndDoc()
        hDC.DeleteDC()

        for f in ["temp_qr.png", "temp_phone_bc.png", "temp_book_bc.png"]:
            if os.path.exists(f): os.remove(f)
                
        return True
    except Exception as e:
        print(f"Windows Printing Error: {e}")
        return False


# ==========================================
# GUI Application
# ==========================================
class PrintAgentApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Studio 7 - Remote Print Agent (Cloud Sync)")
        self.root.geometry("550x420")
        self.root.resizable(False, False)
        
        self.printers = [p[2] for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        default_printer = win32print.GetDefaultPrinter()

        self.create_widgets(default_printer)
        self.is_running = False
        self.polling_thread = None

    def create_widgets(self, default_printer):
        frame_top = tk.Frame(self.root, pady=15)
        frame_top.pack(fill=tk.X)
        
        tk.Label(frame_top, text="ระบบปริ้นเตอร์คิว (เชื่อมต่อ Cloud)", font=("Arial", 16, "bold")).pack()
        self.lbl_status = tk.Label(frame_top, text="สถานะ: หยุดการทำงาน", fg="red", font=("Arial", 10))
        self.lbl_status.pack()
        
        self.lbl_log = tk.Label(frame_top, text="รอเริ่มการเชื่อมต่อ...", fg="gray", font=("Arial", 9))
        self.lbl_log.pack()

        frame_mid = tk.Frame(self.root, padx=30, pady=10)
        frame_mid.pack(fill=tk.BOTH, expand=True)

        # 🟢 ช่องใส่โดเมน Backend (API)
        tk.Label(frame_mid, text="URL เซิร์ฟเวอร์ API (Backend):").pack(anchor=tk.W, pady=(0, 2))
        self.api_var = tk.StringVar(value="https://queue-4c2l.onrender.com")
        self.entry_api = ttk.Entry(frame_mid, textvariable=self.api_var, width=55)
        self.entry_api.pack(anchor=tk.W, pady=(0, 10))

        # 🟢 ช่องใส่โดเมน Frontend (สำหรับ QR Code)
        tk.Label(frame_mid, text="URL สำหรับเช็คคิว (Frontend):").pack(anchor=tk.W, pady=(0, 2))
        self.url_var = tk.StringVar(value="https://queue-4c2l.onrender.com")
        self.entry_url = ttk.Entry(frame_mid, textvariable=self.url_var, width=55)
        self.entry_url.pack(anchor=tk.W, pady=(0, 15))

        tk.Label(frame_mid, text="เลือกเครื่องพิมพ์สลิป:").pack(anchor=tk.W, pady=(0, 5))
        self.printer_var = tk.StringVar()
        self.cb_printers = ttk.Combobox(frame_mid, textvariable=self.printer_var, values=self.printers, state="readonly", width=52)
        if default_printer in self.printers:
            self.cb_printers.set(default_printer)
        self.cb_printers.pack(anchor=tk.W, pady=(0, 20))

        frame_btn = tk.Frame(frame_mid)
        frame_btn.pack(pady=5)

        self.btn_start = tk.Button(frame_btn, text="▶ เปิดการเชื่อมต่อ Cloud", bg="green", fg="white", font=("Arial", 10, "bold"), command=self.toggle_server, width=22, pady=5)
        self.btn_start.grid(row=0, column=0, padx=5)

        self.btn_test = tk.Button(frame_btn, text="พิมพ์ทดสอบ", command=self.test_print, width=15, pady=5)
        self.btn_test.grid(row=0, column=1, padx=5)

    def toggle_server(self):
        if self.is_running:
            self.is_running = False
            self.btn_start.config(text="▶ เปิดการเชื่อมต่อ Cloud", bg="green")
            self.lbl_status.config(text="สถานะ: หยุดการทำงาน", fg="red")
            self.cb_printers.config(state="readonly")
            self.entry_api.config(state="normal")
            self.entry_url.config(state="normal")
        else:
            if not self.printer_var.get() or not self.api_var.get():
                messagebox.showwarning("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบ")
                return

            self.is_running = True
            self.btn_start.config(text="⏹ หยุดการเชื่อมต่อ", bg="red")
            self.lbl_status.config(text="สถานะ: กำลังซิงค์ข้อมูลกับเซิร์ฟเวอร์", fg="green")
            self.cb_printers.config(state="disabled")
            self.entry_api.config(state="disabled")
            self.entry_url.config(state="disabled")
            
            # เริ่ม Thread สำหรับดึงข้อมูลอัตโนมัติ
            self.polling_thread = threading.Thread(target=self.poll_from_server, daemon=True)
            self.polling_thread.start()

    def update_log(self, msg):
        self.root.after(0, lambda: self.lbl_log.config(text=msg))

    def poll_from_server(self):
        api_base = self.api_var.get().strip('/')
        printer_name = self.printer_var.get()
        frontend_url = self.url_var.get()

        while self.is_running:
            try:
                self.update_log(f"กำลังเช็คคิวใหม่... ({datetime.now().strftime('%H:%M:%S')})")
                
                # 1. ยิงไปถามเซิร์ฟเวอร์ว่ามีคิวไหนยังไม่ได้ปริ้นไหม
                res = requests.get(f"{api_base}/api/queue/unprinted", timeout=10)
                if res.status_code == 200:
                    queues = res.json()
                    
                    for q in queues:
                        if not self.is_running: break
                        
                        job = PrintJob(
                            id=q['id'],
                            queue_number=q['queue_number'],
                            service_type=q['service_type'],
                            booking_number=q.get('booking_number'),
                            customer_phone=q.get('customer_phone'),
                            queues_ahead=q.get('queues_ahead', 0)
                        )
                        
                        # 2. ถ้ามี ก็สั่งเครื่องพิมพ์ปริ้น
                        self.update_log(f"กำลังปริ้นคิว {job.queue_number}...")
                        success = print_receipt(job, printer_name, frontend_url)
                        
                        # 3. ถ้าปริ้นสำเร็จ ยิงไปบอก Backend ให้มาร์คว่าปริ้นแล้ว
                        if success:
                            requests.patch(f"{api_base}/api/queue/{job.id}/printed", timeout=5)
                            self.update_log(f"ปริ้นคิว {job.queue_number} สำเร็จ!")
                        
                        time.sleep(1) # หน่วงเวลาพักเครื่องพิมพ์นิดหน่อยระหว่างคิว
                
            except requests.exceptions.RequestException as e:
                self.update_log(f"เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: กำลังลองใหม่...")
            except Exception as e:
                self.update_log(f"เกิดข้อผิดพลาดภายใน: {e}")
            
            # รอ 3 วินาทีก่อนเช็คใหม่
            time.sleep(3)

    def test_print(self):
        printer = self.printer_var.get()
        f_url = self.url_var.get()
        if not printer: return
        test_job = PrintJob(id="test", queue_number="TEST-001", service_type="preorder", booking_number="BK-9999", customer_phone="0812345678")
        print_receipt(test_job, printer, f_url)

if __name__ == "__main__":
    root = tk.Tk()
    app_gui = PrintAgentApp(root)
    root.mainloop()