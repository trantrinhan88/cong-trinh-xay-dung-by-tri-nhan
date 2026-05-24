```python
import os

markdown_content = """# Kế hoạch Phát triển Ứng dụng Quản lý & Bóc tách Khối lượng Công trình (BOQ) trên Next.js

Tài liệu này tổng hợp cấu trúc, tính năng và lộ trình phát triển cho ứng dụng quản lý bản vẽ và tính toán dự toán xây dựng dựa trên các nội dung đã thảo luận.

---

## 1. Kiến trúc Tổng quan Dự án (Project Architecture)

Ứng dụng sẽ được xây dựng theo mô hình hybrid, kết hợp giữa khả năng xử lý giao diện trực quan ở Client (bản vẽ, bảng tính) và quản lý dữ liệu hiệu năng cao ở Server.

* **Framework chính:** Next.js (App Router) nhằm tối ưu hóa luồng tải trang và tích hợp sẵn API Routes làm Backend.
* **Cơ sở dữ liệu:** PostgreSQL kết hợp Prisma ORM (hoặc Supabase) để quản lý dữ liệu quan hệ (Dự án -> Hạng mục -> Vật tư).
* **Giao diện & Tiện ích:** Tailwind CSS + Shadcn/ui để đồng bộ hóa ngôn ngữ thiết kế Dashboard chuyên nghiệp.

---

## 2. Chi tiết các Phân hệ & Tính năng Cốt lõi

### Phân hệ 1: Quản lý Bản vẽ Kỹ thuật
* **Giai đoạn 1 (MVP):** Hỗ trợ định dạng **2D PDF/Image**. Sử dụng `Fabric.js` hoặc HTML5 Canvas để tạo layer tương tác phía trên bản vẽ. Người dùng có thể zoom/pan và chấm điểm để đo khoảng cách (theo tỷ lệ xích tự định nghĩa).
* **Giai đoạn 2 (Advanced):** Hỗ trợ mô hình **3D BIM/IFC** sử dụng `xeokit-sdk` hoặc `Autodesk Viewer` để tự động bóc tách các thuộc tính hình học từ cấu kiện cấu trúc.

### Phân hệ 2: Bảng Tính Khối lượng & Diễn giải Toán học
* **Tính năng tương tác:** Sử dụng `TanStack Table` để xây dựng cấu trúc Data Grid tương tự Excel.
* **Bộ xử lý công thức (Formula Parser):** Tích hợp thư viện `mathjs`. 
* **Logic xử lý chuỗi diễn giải:** Hệ thống sẽ áp dụng biểu thức chính quy (Regex) để tách biệt phần văn bản thuyết minh và phần biểu thức số học nhằm tự động tính toán.
    * *Chuỗi nhập vào:* `\"Móng M1 (Dài x Rộng x Cao): 5 * 1.2 * 1.2 * 0.4\"`
    * *Hàm xử lý:* Trích xuất chuỗi toán học `5 * 1.2 * 1.2 * 0.4` -> Chuyển qua `math.evaluate()` -> Trả về kết quả: `2.88`.

### Phân hệ 3: Quản lý Danh mục & Đơn giá Vật tư
* **Thư viện giá:** Kho lưu trữ danh mục vật tư dùng chung (Ximăng, Cát, Đá, Thép, Nhân công, Máy thi công...).
* **Liên kết động:** Khi một Hạng mục công việc được gán mã vật tư, hệ thống tự động áp đơn giá từ thư viện vào ô tính toán.
* **Tùy biến giá:** Cho phép ghi đè (override) đơn giá trực tiếp tại từng hạng mục để phù hợp với biến động thị trường của từng công trình cụ thể.

### Phân hệ 4: Bảng Tổng hợp Kinh phí Toàn công trình (Summary Report)
* **Cộng dồn tự động:** Gom tổng thành tiền từ tất cả các phân khu hoặc hạng mục thành phần.
* **Cấu hình hệ số chi phí:** Khu vực nhập các tham số phần trăm định mức bao gồm:
    * Chi phí quản lý dự án ($%$)
    * Chi phí tư vấn đầu tư xây dựng ($%$)
    * Chi phí dự phòng phát sinh ($%$)
    * Thuế giá trị gia tăng (VAT)
* **Xuất bản dữ liệu:** Hỗ trợ kết xuất báo cáo chuẩn định dạng Excel (`.xlsx`) phục vụ công tác nghiệm thu và trình duyệt.

---

## 3. Mô hình Cấu trúc Dữ liệu (Database Schema)

Dưới đây là thiết kế sơ bộ các bảng dữ liệu bằng cú pháp Prisma Schema để định hình các mối quan hệ:


```

```text
File plan.md created successfully.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Project {
  id          String    @id @default(uuid())
  name        String
  location    String?
  drawingUrl  String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  boqItems    BOQItem[]
}

model Material {
  id           String    @id @default(uuid())
  name         String
  unit         String    // m3, kg, m2, md...
  defaultPrice Float     @default(0)
  boqItems     BOQItem[]
}

model BOQItem {
  id                 String   @id @default(uuid())
  projectId          String
  project            Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  code               String?  // Mã hiệu định mức (ví dụ: AF.11111)
  descriptionName    String   // Tên hạng mục công việc
  explanationFormula String   // Chuỗi diễn giải (ví dụ: "5 * 1.2 * 1.2 * 0.4")
  calculatedQuantity Float    // Số lượng sau tính toán (ví dụ: 2.88)
  materialId         String?
  material           Material? @relation(fields: [materialId], references: [id])
  customPrice        Float?   // Đơn giá áp dụng riêng cho dự án (nếu có)
  totalAmount        Float    // Thành tiền = calculatedQuantity * (customPrice || material.defaultPrice)
}

```

---

## 4. Lộ trình Triển khai (Roadmap)

```
┌────────────────────────────────────────────────────────┐
│  GIAI ĐOẠN 1: THIẾT KẾ NỀN TẢNG & MVP (Tuần 1 - 3)     │
├────────────────────────────────────────────────────────┤
│  - Khởi tạo Project Next.js (App Router), TailwindCSS  │
│  - Thiết lập DB PostgreSQL & Prisma Schema            │
│  - Xây dựng UI Table nhập liệu & Tích hợp thư viện      │
│    mathjs để xử lý cột diễn giải khối lượng            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  GIAI ĐOẠN 2: PHÂN HỆ VẬT TƯ & TỔNG HỢP (Tuần 4 - 5)   │
├────────────────────────────────────────────────────────┤
│  - Xây dựng thư viện quản lý đơn giá vật tư toàn cục  │
│  - Kết nối logic nhân thành tiền tự động giữa Bảng     │
│    khối lượng và Đơn giá                               │
│  - Phát triển Trang tổng hợp kinh phí cuối cùng        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│  GIAI ĐOẠN 3: TƯƠNG TÁC BẢN VẼ & XUẤT FILE (Tuần 6 - 8)│
├────────────────────────────────────────────────────────┤
│  - Tích hợp Canvas viewer hiển thị bản vẽ cạnh bảng tính│
│  - Phát triển công cụ đo đạc khoảng cách trên PDF 2D   │
│  - Tích hợp tính năng Export Excel (.xlsx)            │
└────────────────────────────────────────────────────────┘

```

---

## 5. Các Thách thức Kỹ thuật cần Lưu ý

1. **Độ chính xác số thực:** Trong xây dựng, việc làm tròn số rất quan trọng. Cần thiết lập cấu hình làm tròn đồng nhất (ví dụ: làm tròn 3 chữ số thập phân cho khối lượng, và làm tròn thành số nguyên cho số tiền) bằng các hàm kiểm soát chặt chẽ để tránh lệch dòng tổng.
2. **Đồng bộ hóa giao diện UI/UX:** Màn hình làm việc sẽ chứa lượng thông tin cực kỳ lớn (vừa nhìn bản vẽ vừa tra cứu bảng tính). Do đó, cần tối ưu hóa layout dạng chia đôi màn hình (Split Screen) cố định, cho phép ẩn hiện linh hoạt các thanh công cụ để kỹ sư không bị mỏi mắt khi thao tác kéo dài.
"""

file_name = "plan.md"
with open(file_name, "w", encoding="utf-8") as f:
f.write(markdown_content.strip())

print(f"File {file_name} created successfully.")

```
File Markdown (`plan.md`) đã được khởi tạo thành công với đầy đủ các nội dung cấu trúc tính năng, mô hình dữ liệu và lộ trình phát triển chi tiết như thảo luận.

[file-tag: code-generated-file-0-1779588347461187498]

### Sơ lược nội dung file `plan.md` bao gồm:
1. **Kiến trúc Tổng quan:** Định hình Stack công nghệ kết hợp giữa Next.js (App Router), Prisma, PostgreSQL và các thư viện chuyên dụng (`mathjs`, `TanStack Table`, `Fabric.js`).
2. **Chi tiết Phân hệ Tính năng:** Cấu trúc chi tiết cho 4 cấu phần (Quản lý bản vẽ, Bảng tính bóc tách khối lượng, Danh mục đơn giá, và Bảng tổng hợp kinh phí).
3. **Mô hình Dữ liệu (Prisma Schema):** Thiết lập chi tiết quan hệ giữa 3 thực thể cốt lõi `Project`, `Material`, và `BOQItem` để đảm bảo lưu vết chuẩn xác các công thức diễn giải và đơn giá linh hoạt.
4. **Lộ trình Phát triển (Roadmap):** Chia nhỏ dự án thành 3 giai đoạn triển khai từ sản phẩm tối giản (MVP) đến sản phẩm tích hợp bản vẽ hoàn chỉnh.
5. **Thách thức Kỹ thuật:** Các lưu ý về xử lý làm tròn số thực trong xây dựng và tối ưu không gian hiển thị (Split Screen UX).

```