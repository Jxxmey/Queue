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
    booking_number: str | None = None   
    customer_phone: str | None = None 
    queues_ahead: int = 0
    officer_name: str = "ระบบอัตโนมัติ"
    branch_name: str = "Studio 7" # 🟢 เพิ่มฟิลด์ชื่อสาขา (ค่าเริ่มต้นเป็น Studio 7)

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
        CUT_COMMAND = b'\x1d\x56\x00' 
        hDC.Escape(19, CUT_COMMAND) 
    except Exception as e:
        print(f"Cannot cut: {e}")

# ==========================================
# ฟังก์ชันพิมพ์ 2 รอบ (ลูกค้า + ร้านค้า)
# ==========================================
def print_receipt(job: PrintJob, printer_name: str, frontend_url: str):
    time_str = datetime.now().strftime("%d/%m/%Y %H:%M")
    service_text = "ซื้อหน้าร้าน (Walk-in)" if job.service_type == "walkin" else "จองสินค้า (Pre-order)"
    
    # ----------------------------------------
    # Document 1: ส่วนของลูกค้า
    # ----------------------------------------
    try:
        hDC1 = win32ui.CreateDC()
        hDC1.CreatePrinterDC(printer_name)
        hDC1.StartDoc("Studio7_Customer_Ticket")
        hDC1.StartPage()
        
        font_large = win32ui.CreateFont({"name": "Tahoma", "height": 80, "weight": 700})
        font_medium = win32ui.CreateFont({"name": "Tahoma", "height": 40, "weight": 700})
        font_normal = win32ui.CreateFont({"name": "Tahoma", "height": 28, "weight": 400})
        font_small = win32ui.CreateFont({"name": "Tahoma", "height": 22, "weight": 400})
        font_xsmall = win32ui.CreateFont({"name": "Tahoma", "height": 18, "weight": 400})
        
        center_x = 280
        current_y = 20
        
        def draw_text_center1(text, font, y_offset):
            hDC1.SelectObject(font)
            size = hDC1.GetTextExtent(text)
            x_offset = center_x - (size[0] // 2)
            hDC1.TextOut(x_offset, y_offset, text)
            return y_offset + size[1] + 10

        def draw_image_center1(image_path, y_offset, target_width=200):
            try:
                img = Image.open(image_path)
                ratio = target_width / float(img.size[0])
                target_height = int((float(img.size[1]) * float(ratio)))
                img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
                
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new(img.mode[:-1], img.size, (255, 255, 255))
                    background.paste(img, img.split()[-1])
                    img = background
                
                dib = ImageWin.Dib(img)
                x_offset = center_x - (target_width // 2)
                dib.draw(hDC1.GetHandleOutput(), (x_offset, y_offset, x_offset + target_width, y_offset + target_height))
                return y_offset + target_height + 20
            except Exception as e:
                return y_offset

        logo_path = "logo.png"
        if os.path.exists(logo_path):
            current_y = draw_image_center1(logo_path, current_y, target_width=220)
        else:
            current_y = draw_text_center1("STUDIO 7", font_medium, current_y)

        # 🟢 แสดงชื่อสาขาบนบัตรคิวลูกค้า
        current_y = draw_text_center1(f"สาขา: {job.branch_name}", font_small, current_y)
        current_y += 5

        current_y = draw_text_center1("** ส่วนสำหรับลูกค้า **", font_normal, current_y)
        current_y = draw_text_center1("บัตรคิวรับบริการ", font_normal, current_y)
        current_y += 5
        current_y = draw_text_center1(job.queue_number, font_large, current_y)
        current_y = draw_text_center1(f"ประเภท: {service_text}", font_normal, current_y)
        current_y += 10

        check_url = f"{frontend_url.strip('/')}/{job.queue_number}"
        qr_file = generate_qrcode(check_url, "temp_qr.png")
        current_y = draw_image_center1(qr_file, current_y, target_width=180)
        current_y = draw_text_center1("สแกนเพื่อดูสถานะคิว", font_small, current_y)
        current_y += 15
        
        current_y = draw_text_center1(f"คิวก่อนหน้า: {job.queues_ahead} คิว", font_medium, current_y)
        current_y = draw_text_center1(f"เวลาออกบัตร: {time_str}", font_small, current_y)
        current_y += 5
        current_y = draw_text_center1("(หากเรียกแล้วไม่มา ขออนุญาตข้ามคิว)", font_xsmall, current_y)
        
        current_y += 80
        execute_cut(hDC1)
        
        hDC1.EndPage()
        hDC1.EndDoc()
        hDC1.DeleteDC()
    except Exception as e:
        print(f"Customer Print Error: {e}")
        return False

    time.sleep(2)

    # ----------------------------------------
    # Document 2: ส่วนของพนักงาน
    # ----------------------------------------
    try:
        hDC2 = win32ui.CreateDC()
        hDC2.CreatePrinterDC(printer_name)
        hDC2.StartDoc("Studio7_Store_Ticket")
        hDC2.StartPage()
        
        font_medium2 = win32ui.CreateFont({"name": "Tahoma", "height": 40, "weight": 700})
        font_normal2 = win32ui.CreateFont({"name": "Tahoma", "height": 28, "weight": 400})
        font_small2 = win32ui.CreateFont({"name": "Tahoma", "height": 22, "weight": 400})
        
        center_x = 280
        current_y = 20
        
        def draw_text_center2(text, font, y_offset):
            hDC2.SelectObject(font)
            size = hDC2.GetTextExtent(text)
            x_offset = center_x - (size[0] // 2)
            hDC2.TextOut(x_offset, y_offset, text)
            return y_offset + size[1] + 10

        def draw_text_left2(text, font, y_offset, x_offset=20):
            hDC2.SelectObject(font)
            size = hDC2.GetTextExtent(text)
            hDC2.TextOut(x_offset, y_offset, text)
            return y_offset + size[1] + 5

        def draw_image_center2(image_path, y_offset, target_width=200):
            try:
                img = Image.open(image_path)
                ratio = target_width / float(img.size[0])
                target_height = int((float(img.size[1]) * float(ratio)))
                img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
                
                if img.mode in ('RGBA', 'LA'):
                    background = Image.new(img.mode[:-1], img.size, (255, 255, 255))
                    background.paste(img, img.split()[-1])
                    img = background
                
                dib = ImageWin.Dib(img)
                x_offset = center_x - (target_width // 2)
                dib.draw(hDC2.GetHandleOutput(), (x_offset, y_offset, x_offset + target_width, y_offset + target_height))
                return y_offset + target_height + 20
            except Exception as e:
                return y_offset

        current_y = draw_text_center2("** ส่วนสำหรับพนักงาน **", font_normal2, current_y)
        # 🟢 แสดงชื่อสาขาบนบัตรคิวพนักงาน
        current_y = draw_text_center2(f"สาขา: {job.branch_name}", font_small2, current_y)
        current_y += 10
        current_y = draw_text_left2(f"คิว: {job.queue_number}", font_medium2, current_y)
        current_y = draw_text_left2(f"พนักงาน: {job.officer_name}", font_normal2, current_y)
        current_y = draw_text_left2(f"บริการ: {service_text}", font_normal2, current_y)
        
        if job.customer_phone:
            current_y += 10
            current_y = draw_text_left2(f"เบอร์ลูกค้า: {job.customer_phone}", font_normal2, current_y)
            phone_bc = generate_barcode(job.customer_phone, "temp_phone_bc.png")
            current_y = draw_image_center2(phone_bc, current_y, target_width=350)
        
        if job.service_type == "preorder" and job.booking_number:
            current_y += 10
            current_y = draw_text_left2(f"เลขที่จอง: {job.booking_number}", font_normal2, current_y)
            book_bc = generate_barcode(job.booking_number, "temp_book_bc.png")
            current_y = draw_image_center2(book_bc, current_y, target_width=400)

        current_y += 100
        execute_cut(hDC2)

        hDC2.EndPage()
        hDC2.EndDoc()
        hDC2.DeleteDC()
    except Exception as e:
        print(f"Store Print Error: {e}")
        return False

    for f in ["temp_qr.png", "temp_phone_bc.png", "temp_book_bc.png"]:
        if os.path.exists(f): os.remove(f)
            
    return True


# ==========================================
# GUI Application
# ==========================================
class PrintAgentApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Studio 7 - Remote Print Agent (Cloud Sync)")
        self.root.geometry("550x480") 
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

        tk.Label(frame_mid, text="รหัสสาขา (Branch ID) เช่น 55:").pack(anchor=tk.W, pady=(0, 2))
        self.branch_var = tk.StringVar(value="182")
        self.entry_branch = ttk.Entry(frame_mid, textvariable=self.branch_var, width=55)
        self.entry_branch.pack(anchor=tk.W, pady=(0, 10))

        tk.Label(frame_mid, text="URL เซิร์ฟเวอร์ API (Backend):").pack(anchor=tk.W, pady=(0, 2))
        self.api_var = tk.StringVar(value="https://queue-4c2l.onrender.com")
        self.entry_api = ttk.Entry(frame_mid, textvariable=self.api_var, width=55)
        self.entry_api.pack(anchor=tk.W, pady=(0, 10))

        tk.Label(frame_mid, text="URL สำหรับเช็คคิว (Frontend):").pack(anchor=tk.W, pady=(0, 2))
        self.url_var = tk.StringVar(value="https://queue-jjq9.onrender.com")
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
            self.entry_branch.config(state="normal") 
        else:
            if not self.printer_var.get() or not self.api_var.get() or not self.branch_var.get():
                messagebox.showwarning("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบ (โดยเฉพาะรหัสสาขา)")
                return

            self.is_running = True
            self.btn_start.config(text="⏹ หยุดการเชื่อมต่อ", bg="red")
            self.lbl_status.config(text=f"สถานะ: กำลังซิงค์ข้อมูล (สาขา {self.branch_var.get()})", fg="green")
            self.cb_printers.config(state="disabled")
            self.entry_api.config(state="disabled")
            self.entry_url.config(state="disabled")
            self.entry_branch.config(state="disabled") 
            
            self.polling_thread = threading.Thread(target=self.poll_from_server, daemon=True)
            self.polling_thread.start()

    def update_log(self, msg):
        self.root.after(0, lambda: self.lbl_log.config(text=msg))

    def poll_from_server(self):
        api_base = self.api_var.get().strip('/')
        printer_name = self.printer_var.get()
        frontend_url = self.url_var.get()
        branch_id = self.branch_var.get().strip() 

        while self.is_running:
            try:
                self.update_log(f"กำลังเช็คคิวใหม่ สาขา {branch_id}... ({datetime.now().strftime('%H:%M:%S')})")
                
                res = requests.get(f"{api_base}/api/queue/unprinted?branch_id={branch_id}", timeout=10)
                if res.status_code == 200:
                    queues = res.json()
                    
                    active_res = requests.get(f"{api_base}/api/queue/active?branch_id={branch_id}", timeout=10)
                    active_queues = active_res.json() if active_res.status_code == 200 else []
                    
                    for q in queues:
                        if not self.is_running: break
                        
                        queue_num = q['queue_number']
                        my_index = next((i for i, item in enumerate(active_queues) if item['queue_number'] == queue_num), 0)
                        
                        # 🟢 ดึง branch_name จากข้อมูลคิวที่ส่งมาจาก Backend
                        b_name = q.get('branch_name', f"สาขา {branch_id}")
                        
                        job = PrintJob(
                            id=q['id'],
                            queue_number=queue_num,
                            service_type=q['service_type'],
                            booking_number=q.get('booking_number'),
                            customer_phone=q.get('customer_phone'),
                            queues_ahead=my_index,
                            branch_name=b_name # ส่งชื่อสาขาเข้า PrintJob
                        )
                        
                        self.update_log(f"กำลังปริ้นคิว {job.queue_number}...")
                        success = print_receipt(job, printer_name, frontend_url)
                        
                        if success:
                            requests.patch(f"{api_base}/api/queue/{job.id}/printed", timeout=5)
                            self.update_log(f"ปริ้นคิว {job.queue_number} สำเร็จ!")
                        
                        time.sleep(1) 
                
            except requests.exceptions.RequestException as e:
                self.update_log(f"เชื่อมต่อเซิร์ฟเวอร์ไม่ได้: กำลังลองใหม่...")
            except Exception as e:
                self.update_log(f"เกิดข้อผิดพลาดภายใน: {e}")
            
            time.sleep(3)

    def test_print(self):
        printer = self.printer_var.get()
        f_url = self.url_var.get()
        if not printer: return
        
        test_job = PrintJob(
            id="test", 
            queue_number="TEST-001", 
            service_type="preorder", 
            booking_number="F18/PRESTU26099999", 
            customer_phone="0812345678",
            queues_ahead=3,
            branch_name="ID335 : Studio 7-Central-Pinklao"
        )
        print_receipt(test_job, printer, f_url)

if __name__ == "__main__":
    root = tk.Tk()
    app_gui = PrintAgentApp(root)
    root.mainloop()