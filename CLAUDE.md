Kế hoạch Triển khai: Ứng dụng Bóc tách Khối lượng & Dự toán Công trình Xây dựng (Next.js)
Ứng dụng sẽ được xây dựng trên Next.js (App Router, TypeScript) nhằm cung cấp cho kỹ sư và chủ đầu tư một công cụ bóc tách khối lượng (BOQ) chuyên nghiệp ngay trên trình duyệt.

Dự án kết hợp giữa Bản vẽ kỹ thuật tương tác (cho phép nhập bản vẽ, đo đạc kích thước theo tỷ lệ scale tự chọn) và Bảng tính toán diễn giải khối lượng tự động kết nối động với Thư viện đơn giá vật tư để lập Bảng tổng hợp kinh phí toàn bộ công trình (bao gồm cả thuế phí, hệ số hao hụt).

1. Kiến trúc & Ngôn ngữ Thiết kế (Visual & Architectural Design)
Thiết kế Thẩm mỹ (Premium Aesthetics)
Theo tiêu chuẩn phát triển ứng dụng cao cấp, chúng tôi sẽ tránh giao diện đơn điệu và thiết kế một dashboard hiện đại theo phong cách Sleek Engineer Dark/Light Hybrid với các đặc điểm:

Hệ màu: Xanh kỹ thuật (Slate Blue/Teal), xám chì sâu (deep charcoal) kết hợp với các hiệu ứng kính mờ (glassmorphism), viền mỏng tinh tế và đổ bóng mềm.
Typography: Sử dụng Google Font Inter kết hợp JetBrains Mono cho các khu vực nhập liệu công thức toán học để tối ưu tính rõ ràng và chuẩn xác.
Micro-animations: Trải nghiệm hover mượt mà trên các nút bấm, hiệu ứng chuyển tab êm ái, hoạt ảnh vẽ trực quan trên Canvas khi đo đạc bản vẽ.
Layout split-screen: Tối ưu hóa không gian làm việc với màn hình chia đôi (bản vẽ kỹ thuật bên trái, bảng tính toán bóc tách khối lượng bên phải), giúp kỹ sư vừa quan sát bản vẽ vừa nhập liệu mà không cần chuyển đổi cửa sổ.
Cấu trúc Thư mục Dự án
Dự án được khởi tạo Next.js với App Router, sử dụng TypeScript và hệ thống CSS Modules (Vanilla CSS) để kiểm soát phong cách thiết kế tốt nhất:

text

/src
  /app
    layout.tsx         # Layout toàn cục ứng dụng
    page.tsx           # Dashboard chính (Split-screen)
    globals.css        # Biến màu sắc hệ thống, reset và các style nền tảng
  /components
    DrawingViewer.tsx  # Phân hệ tương tác bản vẽ (Canvas)
    BOQTable.tsx       # Bảng tính bóc tách khối lượng, diễn giải toán học
    MaterialLibrary.tsx# Thư viện danh mục & đơn giá vật tư
    SummaryReport.tsx  # Bảng tổng hợp kinh phí & biểu đồ phân bổ
  /utils
    formulaParser.ts   # Bộ phân tích chuỗi diễn giải toán học tự động
  /types
    index.ts           # Định nghĩa cấu trúc dữ liệu (Project, BOQItem, Material...)
2. Chi tiết các Phân hệ Tính năng
Phân hệ 1: Tương tác Bản vẽ Kỹ thuật (DrawingViewer.tsx)
Nhập bản vẽ: Người dùng có thể kéo thả file ảnh bản vẽ (PNG, JPEG) hoặc PDF (sẽ được mô phỏng render chất lượng cao).
Bản vẽ Mẫu tích hợp: Để tối ưu hóa trải nghiệm sử dụng ngay lập tức, ứng dụng tích hợp sẵn 3 bản vẽ mẫu chất lượng cao (ví dụ: Bản vẽ Mặt bằng Móng, Mặt bằng Cột, Mặt bằng Tường xây).
Công cụ Hiệu chuẩn tỷ lệ (Scale Calibration): Cho phép kích vào 2 điểm trên bản vẽ, nhập khoảng cách thực tế (ví dụ: 5.0m) để tính ra tỷ lệ Pixel-to-Meter.
Công cụ Đo đạc trực quan:
Đo khoảng cách (Linear): Kéo thả đường thẳng trên bản vẽ để lấy chiều dài thực tế (mét).
Đo diện tích (Area): Vẽ hình chữ nhật/đa giác trên bản vẽ để tính diện tích thực tế ($m^2$).
Các số đo này sẽ có nút "Chuyển sang Bảng tính" để tự động điền vào dòng bóc tách hiện tại.
Phân hệ 2: Bảng Tính bóc tách & Diễn giải Khối lượng (BOQTable.tsx & formulaParser.ts)
Diễn giải Toán học thông minh: Tự động tách phần mô tả chữ viết và phần biểu thức toán học.
Ví dụ chuỗi nhập vào: "Bê tông móng M1: 4 * 1.5 * 1.5 * 0.6" hoặc "Dầm D2 (Rộng * Cao * Dài): 2 * 0.3 * 0.5 * 6.5" hoặc "Sàn S1: 4.5 * 6.2 - 1.2 * 1.5 (trừ ô sàn mở)".
Hệ thống sẽ lọc bỏ chú thích, trích xuất biểu thức tính toán 4 * 1.5 * 1.5 * 0.6, kiểm tra tính an toàn toán học và tự động tính toán ra kết quả chính xác (3.6).
Liên kết thư viện vật tư: Mỗi dòng BOQ cho phép chọn loại vật tư từ thư viện qua dropdown. Khi chọn vật tư, hệ thống sẽ điền đơn giá mặc định.
Tùy chọn ghi đè đơn giá (Override): Kỹ sư có thể sửa trực tiếp đơn giá tại dòng đó (áp dụng đơn giá riêng cho hạng mục này) hoặc dùng đơn giá mặc định của vật tư.
Phân hệ 3: Quản lý Thư viện Vật tư (MaterialLibrary.tsx)
Giao diện quản lý danh mục vật tư xây dựng bao gồm: Tên vật tư, Đơn vị tính (m3, m2, kg, cái...), Đơn giá gốc (VND).
Cho phép thêm mới, chỉnh sửa và xóa vật tư.
Cung cấp danh mục vật tư mẫu đa dạng bao gồm nhóm: Bê tông, Thép, Gạch xây, Cát cát đá, Xi măng, Sơn nước, Nhân công, v.v.
Phân hệ 4: Tổng hợp Kinh phí Công trình (SummaryReport.tsx)
Bảng tổng hợp dự toán chuẩn Bộ Xây dựng:
Chi phí Trực tiếp (T): Tổng tiền vật tư từ bảng BOQ.
Chi phí Gián tiếp (GT): $6%$ của Chi phí Trực tiếp (phục vụ lán trại, quản lý công trường).
Thu nhập chịu thuế tính trước (TL): $5.5%$ của $(T + GT)$.
Thuế giá trị gia tăng (VAT): $10%$ của $(T + GT + TL)$.
Chi phí Dự phòng (DP): $5%$ của tổng các chi phí trên.
Tổng cộng Kinh phí Xây dựng: Tổng của tất cả các hạng mục trên.
Biểu đồ trực quan: Hiển thị tỷ trọng chi phí của từng loại cấu phần vật tư (ví dụ: Bê tông chiếm bao nhiêu phần trăm, Thép bao nhiêu...).
Lưu trữ & Xuất dữ liệu:
Xuất báo cáo PDF/Excel đẹp mắt.
Hỗ trợ Tải lên (Import) và Tải xuống (Export) toàn bộ dự án dưới dạng file JSON cấu trúc để làm việc tiếp sau này.
3. Quy trình thực hiện chi tiết
Khởi tạo ứng dụng Next.js
Thiết lập System Design & globals.css
Phát triển Bộ xử lý công thức formulaParser.ts
Xây dựng phân hệ Quản lý Vật tư & Mẫu
Xây dựng Bảng BOQ nhập liệu Diễn giải Khối lượng
Xây dựng Canvas Viewer Bản vẽ & Đo đạc Tương tác
Xây dựng Bảng Tổng hợp Kinh phí & Xuất báo cáo
Kiểm thử, tối ưu hiệu năng & làm mịn UI/UX
Các bước triển khai:
Bước 1: Khởi tạo dự án Next.js bằng create-next-app với tùy chọn TypeScript, App Router, ESLint và sử dụng Vanilla CSS Modules để tối ưu hóa hiệu ứng hình ảnh.
Bước 2: Cập nhật src/app/globals.css để thiết lập hệ thống biến màu sắc (Theme CSS Variables) cho Dark/Light mode và thiết lập phong cách thiết kế Sleek Engineering.
Bước 3: Tạo bộ thư viện src/utils/formulaParser.ts để bóc tách diễn giải số lượng dạng chuỗi tự động và tính toán kết quả số thực an toàn.
Bước 4: Xây dựng file src/types/index.ts chứa toàn bộ kiểu dữ liệu.
Bước 5: Phát triển component MaterialLibrary.tsx giúp quản lý đơn giá vật tư cốt lõi.
Bước 6: Phát triển component BOQTable.tsx - trái tim của phần tính toán khối lượng công trình.
Bước 7: Phát triển component DrawingViewer.tsx hỗ trợ tải ảnh bản vẽ kỹ thuật lên, zoom/pan và đo đạc trực quan bằng Canvas.
Bước 8: Phát triển component SummaryReport.tsx để hiển thị bảng tổng hợp kinh phí đầy đủ các hệ số thuế phí theo tiêu chuẩn ngành xây dựng Việt Nam.
Bước 9: Tích hợp toàn bộ vào màn hình chính src/app/page.tsx với thiết kế Split Screen tương tác cao.
4. Kế hoạch Xác minh & Kiểm thử (Verification Plan)
Kiểm thử Tự động & Thủ công
Kiểm tra Bộ phân tích Công thức:
Kiểm thử với chuỗi: "Móng M1: 2 * 3 * 1.5" -> Kết quả mong muốn: 9.0
Kiểm thử với chuỗi hỗn hợp: "Dầm D1: 2 * (0.3 * 0.4 * 5.5) + 3 * (0.2 * 0.3 * 4.8)" -> Kết quả mong muốn: 1.32 + 0.864 = 2.184
Kiểm thử với chuỗi có trừ bớt khoảng trống: "Sàn S1: 5.0 * 6.0 - 1.2 * 1.5 (trừ hộp kỹ thuật)" -> Kết quả mong muốn: 28.2
Kiểm tra Đo đạc trên Canvas:
Thay đổi tỷ lệ Scale và vẽ thử các nét đo đạc để xác định khoảng cách và diện tích trả về có khớp với tỷ lệ xích thực tế hay không.
Kiểm tra Liên kết Giá và Tổng hợp Kinh phí:
Khi thay đổi đơn giá gốc của một vật tư trong thư viện hoặc ghi đè (override) tại bảng BOQ, đảm bảo Thành tiền cột BOQ và dòng Tổng hợp tương ứng tại bảng Báo cáo cập nhật tức thì (Real-time reactivity).
5. Câu hỏi hoặc Lựa chọn cần Ý kiến của Người dùng
NOTE

Để chuẩn bị triển khai tốt nhất, chúng tôi đề xuất triển khai toàn bộ ứng dụng dưới dạng một Ứng dụng Single-Page Dashboard siêu tương tác (mọi trạng thái dữ liệu lưu trữ trực tiếp trong localStorage để có thể Lưu dự án, Tải dự án lên, chuyển đổi tức thì giữa các bản vẽ mẫu, đo đạc và cập nhật bảng tính real-time không trễ). Phương án này giúp ứng dụng chạy cực kỳ mượt mà, độc lập và dễ dàng chạy thử nghiệm mà không cần cài đặt cơ sở dữ liệu PostgreSQL cục bộ phức tạp.

Ý kiến của bạn: Bạn có đồng ý với phương án triển khai này không? Nếu có, tôi sẽ bắt đầu khởi tạo dự án và triển khai ngay lập tức.@AGENTS.md
