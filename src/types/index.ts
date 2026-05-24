export interface Material {
  id: string;
  name: string;
  unit: string; // m3, kg, m2, md, cai, tan...
  defaultPrice: number; // Đơn giá gốc mặc định (VND)
  category?: string; // Bê tông, Thép, Gạch, Hoàn thiện, Nhân công...
}

export interface BOQItem {
  id: string;
  projectId: string;
  code?: string; // Mã hiệu định mức (ví dụ: AF.11111)
  descriptionName: string; // Tên hạng mục công việc
  explanationFormula: string; // Chuỗi diễn giải (ví dụ: "Móng M1: 5 * 1.2 * 1.2 * 0.4")
  calculatedQuantity: number; // Số lượng sau khi tính toán (ví dụ: 2.88)
  materialId?: string; // ID của vật tư được liên kết
  customPrice?: number; // Đơn giá ghi đè (nếu có)
  totalAmount: number; // Thành tiền = calculatedQuantity * (customPrice || material.defaultPrice)
}

export interface Measurement {
  id: string;
  type: 'linear' | 'area';
  points: { x: number; y: number }[]; // Tọa độ pixel trên canvas
  value: number; // Giá trị thực tế (mét hoặc m2)
  label: string; // Ví dụ: "Đo bức tường A", "Diện tích phòng khách"
  color: string;
}

export interface Drawing {
  id: string;
  name: string;
  url: string; // File URL hoặc Base64 hoặc mẫu
  scale: number; // Tỷ lệ xích: 1 mét thực tế = ? pixel trên canvas (ví dụ: 50 px/m)
  measurements: Measurement[];
}

export interface Project {
  id: string;
  name: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  boqItems: BOQItem[];
  drawings: Drawing[];
  activeDrawingId?: string;
}
