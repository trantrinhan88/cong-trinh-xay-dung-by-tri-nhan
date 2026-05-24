import React, { useRef, useState, useEffect } from 'react';
import { Drawing, Measurement } from '../types';
import styles from './DrawingViewer.module.css';

interface DrawingViewerProps {
  drawings: Drawing[];
  activeDrawingId?: string;
  onSelectDrawing: (id: string) => void;
  onAddDrawing: (drawing: Drawing) => void;
  onUpdateDrawingScale: (drawingId: string, scale: number) => void;
  onAddMeasurement: (drawingId: string, measurement: Measurement) => void;
  onDeleteMeasurement: (drawingId: string, measurementId: string) => void;
  onSetActiveMeasurementForBOQ: (measurement: { label: string; value: number } | null) => void;
}

export default function DrawingViewer({
  drawings,
  activeDrawingId,
  onSelectDrawing,
  onAddDrawing,
  onUpdateDrawingScale,
  onAddMeasurement,
  onDeleteMeasurement,
  onSetActiveMeasurementForBOQ,
}: DrawingViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeDrawing = drawings.find((d) => d.id === activeDrawingId) || drawings[0];

  const [tool, setTool] = useState<'pan' | 'calibrate' | 'length' | 'area'>('pan');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);

  // Hiển thị hộp thoại nhập khoảng cách thực tế
  const [showCalibrateModal, setShowCalibrateModal] = useState(false);
  const [tempPixelDistance, setTempPixelDistance] = useState(0);
  const [realDistanceInput, setRealDistanceInput] = useState('5.0');

  // Vẽ bản vẽ mẫu trên Canvas dựa trên loại bản vẽ
  const drawBlueprint = (ctx: CanvasRenderingContext2D, width: number, height: number, type: string) => {
    ctx.clearRect(0, 0, width, height);

    // Vẽ lưới nền kỹ thuật (Grid background)
    ctx.strokeStyle = '#e2e8f033'; // Mờ hơn cho dark/light
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (type === 'drawing_mong') {
      // BẢN VẼ MẶT BẰNG MÓNG
      // Vẽ các trục Grid lines
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      // Các trục ngang và dọc
      const xLines = [100, 250, 400, 550];
      const yLines = [100, 250, 400];
      
      xLines.forEach((x, i) => {
        ctx.beginPath();
        ctx.moveTo(x, 50);
        ctx.lineTo(x, 450);
        ctx.stroke();
        // Gắn nhãn trục A, B, C, D
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 12px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.fillText(String.fromCharCode(65 + i), x, 40);
        ctx.fillText(String.fromCharCode(65 + i), x, 470);
      });

      yLines.forEach((y, i) => {
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(600, y);
        ctx.stroke();
        // Gắn nhãn trục 1, 2, 3
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 12px var(--font-sans)';
        ctx.textAlign = 'right';
        ctx.fillText((i + 1).toString(), 40, y + 4);
        ctx.fillText((i + 1).toString(), 615, y + 4);
      });
      ctx.setLineDash([]);

      // Vẽ các khối móng cột tại các giao điểm trục
      xLines.forEach((x) => {
        yLines.forEach((y) => {
          // Bê tông móng (hình vuông to bên ngoài)
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.fillStyle = '#f1f5f999';
          ctx.beginPath();
          ctx.rect(x - 30, y - 30, 60, 60);
          ctx.fill();
          ctx.stroke();

          // Hatching (gạch chéo góc bê tông móng)
          ctx.strokeStyle = '#94a3b833';
          ctx.lineWidth = 1;
          for (let d = -20; d <= 20; d += 10) {
            ctx.beginPath();
            ctx.moveTo(x - 30 + d, y - 30);
            ctx.lineTo(x - 30, y - 30 + d);
            ctx.stroke();
          }

          // Cổ cột (hình vuông nhỏ bên trong)
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 2;
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.rect(x - 10, y - 10, 20, 20);
          ctx.fill();
          ctx.stroke();

          // Ghi chú móng M1
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 10px var(--font-sans)';
          ctx.textAlign = 'left';
          ctx.fillText('M1 (1.2x1.2)', x + 35, y + 4);
        });
      });

      // Vẽ giằng móng nối các móng
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      xLines.forEach((x, idx) => {
        if (idx < xLines.length - 1) {
          ctx.beginPath();
          ctx.moveTo(x + 30, 250);
          ctx.lineTo(xLines[idx + 1] - 30, 250);
          ctx.stroke();
          
          ctx.fillStyle = '#475569';
          ctx.font = '9px var(--font-sans)';
          ctx.textAlign = 'center';
          ctx.fillText('GM1 (0.3x0.5)', (x + xLines[idx + 1]) / 2, 243);
        }
      });

      // Đường kích thước (Dimension lines) mẫu
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Đường đo dọc
      ctx.moveTo(80, 100);
      ctx.lineTo(80, 250);
      ctx.stroke();
      // Mũi tên đo vẽ bằng gạch xiên kỹ thuật
      ctx.beginPath();
      ctx.moveTo(75, 105); ctx.lineTo(85, 95);
      ctx.moveTo(75, 255); ctx.lineTo(85, 245);
      ctx.stroke();
      // Nhãn đo kích thước
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 10px var(--font-mono)';
      ctx.textAlign = 'center';
      ctx.save();
      ctx.translate(72, 175);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('3000 mm (3.0m)', 0, 0);
      ctx.restore();

      // Tiêu đề bản vẽ
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText('MẶT BẰNG KẾT CẤU MÓNG (MẪU)', width / 2, 25);

    } else if (type === 'drawing_tuong') {
      // BẢN VẼ MẶT BẰNG TƯỜNG XÂY TẦNG 1
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 5; // Tường dày 220px
      ctx.fillStyle = '#e2e8f0';

      // Vẽ bao cảnh nhà (Tường bao 600x350)
      ctx.beginPath();
      ctx.rect(80, 80, 480, 320);
      ctx.stroke();

      // Vẽ tường ngăn phòng ngủ
      ctx.beginPath();
      ctx.moveTo(320, 80);
      ctx.lineTo(320, 280);
      ctx.stroke();

      // Vẽ tường phòng WC
      ctx.beginPath();
      ctx.moveTo(320, 280);
      ctx.lineTo(440, 280);
      ctx.lineTo(440, 80);
      ctx.stroke();

      // Đục lỗ cửa ra vào (Vẽ khoảng mở)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(150, 75, 60, 10); // Cửa đi tường trước
      ctx.fillRect(340, 275, 45, 10); // Cửa đi WC
      ctx.fillRect(295, 140, 10, 50); // Cửa đi phòng ngủ
      
      // Vẽ cánh cửa gỗ
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(150, 80, 60, 0, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(150, 80); ctx.lineTo(150, 140);
      ctx.stroke();

      // Ghi chú phòng
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText('PHÒNG KHÁCH', 200, 220);
      ctx.fillText('P.NGỦ 1', 200, 350);
      ctx.fillText('WC 1', 380, 180);
      ctx.fillText('HÀNH LANG', 450, 350);

      // Ký hiệu cột chịu lực
      ctx.fillStyle = '#475569';
      const columns = [[80, 80], [320, 80], [560, 80], [80, 400], [320, 400], [560, 400]];
      columns.forEach(([x, y]) => {
        ctx.fillRect(x - 10, y - 10, 20, 20);
      });

      // Tiêu đề
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText('MẶT BẰNG XÂY DỰNG TẦNG 1 (MẪU)', width / 2, 25);

    } else if (type === 'drawing_dam') {
      // CHI TIẾT CỐT THÉP DẦM
      // Vẽ viền bê tông cốt thép dầm dọc
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#f8fafc99';
      ctx.fillRect(50, 150, 550, 120);
      ctx.strokeRect(50, 150, 550, 120);

      // Thép dọc chủ lực thượng (2 thanh phi 18 - màu đỏ đậm ở đỉnh dầm)
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(60, 165);
      ctx.lineTo(590, 165);
      ctx.stroke();

      // Thép dọc chủ lực hạ (2 thanh phi 20 - màu đỏ đậm ở đáy dầm)
      ctx.beginPath();
      ctx.moveTo(60, 255);
      ctx.lineTo(590, 255);
      ctx.stroke();

      // Vẽ thép đai phi 6 (Thanh bọc thẳng đứng màu xanh lam nhạt)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      const stirrupSpacing = 40;
      for (let x = 80; x <= 570; x += stirrupSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 165);
        ctx.lineTo(x, 255);
        ctx.stroke();
      }

      // Nhãn ghi chú cấu kiện
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 9px var(--font-sans)';
      ctx.textAlign = 'left';
      ctx.fillText('2 Φ18 (Lớp trên)', 80, 155);
      ctx.fillText('2 Φ20 (Lớp dưới)', 80, 280);

      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 9px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText('Φ6 a150 (Đai)', 300, 210);

      // Mặt cắt A-A
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(450, 320, 80, 100);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(450, 320, 80, 100);
      
      // Chấm thép mặt cắt
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(460, 335, 5, 0, Math.PI * 2);
      ctx.arc(520, 335, 5, 0, Math.PI * 2);
      ctx.arc(460, 405, 6, 0, Math.PI * 2);
      ctx.arc(520, 405, 6, 0, Math.PI * 2);
      ctx.fill();

      // Đai bao mặt cắt
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(458, 333, 64, 74);

      // Chú thích mặt cắt
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText('Mặt cắt A-A', 490, 440);

      // Tiêu đề
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText('CHI TIẾT BỐ TRÍ CỐT THÉP DẦM D1 (MẪU)', width / 2, 25);
    } else {
      // BẢN VẼ TẢI LÊN (CUSTOM IMAGE)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px var(--font-sans)';
      ctx.textAlign = 'center';
      ctx.fillText(`BẢN VẼ TỰ TẢI LÊN: ${activeDrawing.name}`, width / 2, height / 2 - 20);
      ctx.fillStyle = '#475569';
      ctx.font = '11px var(--font-sans)';
      ctx.fillText('(Vui lòng hiệu chuẩn tỷ lệ và thực hiện đo đạc trực quan)', width / 2, height / 2 + 10);
    }
  };

  // Re-draw Canvas khi có thay đổi trạng thái
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    // Áp dụng Phóng to (Zoom) và Di chuyển (Pan Offset)
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // 1. Vẽ Bản vẽ kỹ thuật nền
    drawBlueprint(ctx, width, height, activeDrawing.id);

    // 2. Vẽ các số đo đã có trên bản vẽ (Measurements)
    activeDrawing.measurements.forEach((m) => {
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2.5;

      if (m.type === 'linear') {
        const [p1, p2] = m.points;
        if (!p1 || !p2) return;

        // Vẽ đường đo khoảng cách chính
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Vẽ 2 vạch chặn đầu (gạch xiên kích thước xây dựng)
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const tickLength = 10;
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(p1.x - Math.cos(angle + Math.PI/4) * tickLength, p1.y - Math.sin(angle + Math.PI/4) * tickLength);
        ctx.lineTo(p1.x + Math.cos(angle + Math.PI/4) * tickLength, p1.y + Math.sin(angle + Math.PI/4) * tickLength);
        ctx.moveTo(p2.x - Math.cos(angle + Math.PI/4) * tickLength, p2.y - Math.sin(angle + Math.PI/4) * tickLength);
        ctx.lineTo(p2.x + Math.cos(angle + Math.PI/4) * tickLength, p2.y + Math.sin(angle + Math.PI/4) * tickLength);
        ctx.stroke();

        // Viết nhãn ghi chú khoảng cách ở điểm giữa
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.fillStyle = m.color;
        ctx.font = 'bold 11px var(--font-mono)';
        ctx.textAlign = 'center';
        
        // Vẽ box nền trắng cho nhãn
        const labelText = `${m.value.toFixed(3)} m`;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);
        ctx.strokeStyle = m.color;
        ctx.strokeRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);

        ctx.fillStyle = m.color;
        ctx.fillText(labelText, midX, midY + 4);

      } else if (m.type === 'area') {
        const [p1, p2] = m.points;
        if (!p1 || !p2) return;

        // Vẽ hình chữ nhật vùng diện tích
        ctx.fillStyle = m.color + '33'; // Thêm opacity alpha
        ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

        // Vẽ nhãn ghi chú diện tích ở tâm
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.font = 'bold 11px var(--font-mono)';
        ctx.textAlign = 'center';

        const labelText = `${m.value.toFixed(3)} m²`;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);
        ctx.strokeStyle = m.color;
        ctx.strokeRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);

        ctx.fillStyle = m.color;
        ctx.fillText(labelText, midX, midY + 4);
      }
    });

    // 3. Vẽ đường đang đo dở dang (Active Temp Drawing)
    if (isDrawing && startPoint && currentPoint) {
      ctx.strokeStyle =
        tool === 'calibrate' ? '#3b82f6' : tool === 'length' ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2;

      if (tool === 'calibrate' || tool === 'length') {
        // Vẽ nét đứt đo dài
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Vẽ điểm tròn 2 đầu
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, 4, 0, Math.PI * 2);
        ctx.arc(currentPoint.x, currentPoint.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Ước lượng hiển thị số đo thực tế
        const dx = currentPoint.x - startPoint.x;
        const dy = currentPoint.y - startPoint.y;
        const pixels = Math.sqrt(dx * dx + dy * dy);
        const tempReal = pixels / activeDrawing.scale;

        const midX = (startPoint.x + currentPoint.x) / 2;
        const midY = (startPoint.y + currentPoint.y) / 2;
        ctx.font = 'bold 10px var(--font-mono)';
        ctx.fillStyle = '#ffffff';
        
        const labelText = tool === 'calibrate' ? `Đang đo tỷ lệ: ${pixels.toFixed(0)}px` : `${tempReal.toFixed(2)} m`;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, midX, midY + 4);

      } else if (tool === 'area') {
        // Vẽ khung chữ nhật vùng diện tích đang khoanh
        ctx.fillStyle = '#f59e0b22';
        ctx.fillRect(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
        
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(startPoint.x, startPoint.y, currentPoint.x - startPoint.x, currentPoint.y - startPoint.y);
        ctx.setLineDash([]);

        // Tính toán diện tích tạm thời
        const w = (currentPoint.x - startPoint.x) / activeDrawing.scale;
        const h = (currentPoint.y - startPoint.y) / activeDrawing.scale;
        const tempArea = Math.abs(w * h);

        const midX = (startPoint.x + currentPoint.x) / 2;
        const midY = (startPoint.y + currentPoint.y) / 2;
        ctx.font = 'bold 10px var(--font-mono)';
        ctx.fillStyle = '#ffffff';

        const labelText = `${tempArea.toFixed(2)} m²`;
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, midX, midY + 4);
      }
    }

    ctx.restore();
  }, [activeDrawing, zoom, offset, tool, isDrawing, startPoint, currentPoint]);

  // Nhận tọa độ chuột tương đối trên Canvas (đã bù trừ Phóng to & Di chuyển)
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return {
      x: (x - offset.x) / zoom,
      y: (y - offset.y) / zoom,
    };
  };

  // Click chuột bắt đầu vẽ hoặc Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Chỉ nhận chuột trái
    
    const coords = getCanvasCoords(e);

    if (tool === 'pan') {
      setIsDrawing(true);
      setStartPoint({ x: e.clientX, y: e.clientY }); // Lưu tọa độ client để Pan
    } else {
      setIsDrawing(true);
      setStartPoint(coords);
      setCurrentPoint(coords);
    }
  };

  // Di chuyển chuột vẽ tiếp hoặc Pan
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    if (tool === 'pan') {
      if (!startPoint) return;
      const dx = e.clientX - startPoint.x;
      const dy = e.clientY - startPoint.y;
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setStartPoint({ x: e.clientX, y: e.clientY });
    } else {
      const coords = getCanvasCoords(e);
      setCurrentPoint(coords);
    }
  };

  // Thả chuột hoàn tất thao tác vẽ
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === 'pan') {
      setStartPoint(null);
      return;
    }

    const coords = getCanvasCoords(e);
    
    if (startPoint && currentPoint) {
      const dx = coords.x - startPoint.x;
      const dy = coords.y - startPoint.y;
      const pixels = Math.sqrt(dx * dx + dy * dy);

      if (pixels < 5) {
        // Click quá ngắn, bỏ qua tránh đo rác
        setStartPoint(null);
        setCurrentPoint(null);
        return;
      }

      if (tool === 'calibrate') {
        // Bắt đầu lưu khoảng cách pixel và mở Modal yêu cầu nhập chiều dài thực tế
        setTempPixelDistance(pixels);
        setShowCalibrateModal(true);
      } else if (tool === 'length') {
        const realVal = pixels / activeDrawing.scale;
        const newMeas: Measurement = {
          id: 'meas_' + Date.now(),
          type: 'linear',
          points: [startPoint, coords],
          value: realVal,
          label: `Đo Dài L=${realVal.toFixed(2)}m`,
          color: '#10b981',
        };
        onAddMeasurement(activeDrawing.id, newMeas);
      } else if (tool === 'area') {
        const w = Math.abs(dx) / activeDrawing.scale;
        const h = Math.abs(dy) / activeDrawing.scale;
        const realArea = w * h;
        const newMeas: Measurement = {
          id: 'meas_' + Date.now(),
          type: 'area',
          points: [startPoint, coords],
          value: realArea,
          label: `Đo Diện tích S=${realArea.toFixed(2)}m²`,
          color: '#f59e0b',
        };
        onAddMeasurement(activeDrawing.id, newMeas);
      }
    }

    setStartPoint(null);
    setCurrentPoint(null);
  };

  // Lưu tỷ lệ xích sau khi hiệu chuẩn
  const handleSaveCalibration = () => {
    const realDist = parseFloat(realDistanceInput);
    if (isNaN(realDist) || realDist <= 0 || tempPixelDistance <= 0) return;

    // Tỷ lệ xích: 1 mét thực tế = ? pixel trên màn hình
    const newScale = tempPixelDistance / realDist;
    onUpdateDrawingScale(activeDrawing.id, newScale);
    
    setShowCalibrateModal(false);
    setTool('pan');
  };

  // Xử lý zoom
  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    if (direction === 'in') {
      setZoom((z) => Math.min(z + 0.1, 3));
    } else if (direction === 'out') {
      setZoom((z) => Math.max(z - 0.1, 0.5));
    } else {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  // Người dùng tải ảnh tự chọn
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const customDrawing: Drawing = {
        id: 'drawing_custom_' + Date.now(),
        name: file.name,
        url: dataUrl,
        scale: 45, // Tỷ lệ mặc định: 45 pixel = 1m
        measurements: [],
      };
      onAddDrawing(customDrawing);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.container}>
      {/* Thanh điều khiển trên cùng (Header controls) */}
      <div className={styles.header}>
        <div className={styles.drawingSelector}>
          <label htmlFor="draw-select">🗺️ Bản vẽ đang xem:</label>
          <select
            id="draw-select"
            value={activeDrawingId}
            onChange={(e) => onSelectDrawing(e.target.value)}
          >
            {drawings.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.id.startsWith('drawing_custom') ? '(Tự tải)' : '(Mẫu)'}
              </option>
            ))}
          </select>

          <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
            📤 Tải bản vẽ khác
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        <div className={styles.zoomControls}>
          <button title="Phóng to" onClick={() => handleZoom('in')}>
            ➕
          </button>
          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button title="Thu nhỏ" onClick={() => handleZoom('out')}>
            ➖
          </button>
          <button title="Reset vị trí" onClick={() => handleZoom('reset')}>
            🔄
          </button>
        </div>
      </div>

      {/* Thanh công cụ đo đạc bên dưới Header */}
      <div className={styles.toolbar}>
        <button
          className={`${styles.toolBtn} ${tool === 'pan' ? styles.activeTool : ''}`}
          onClick={() => setTool('pan')}
          title="Di chuyển & Quan sát bản vẽ"
        >
          🖐️ Di chuyển (Pan)
        </button>
        <button
          className={`${styles.toolBtn} ${tool === 'calibrate' ? styles.activeTool : ''}`}
          onClick={() => setTool('calibrate')}
          title="Click 2 điểm đã biết chiều dài và nhập giá trị để định vị tỷ lệ xích bản vẽ"
        >
          📐 Hiệu chuẩn tỷ lệ
        </button>
        <button
          className={`${styles.toolBtn} ${tool === 'length' ? styles.activeTool : ''}`}
          onClick={() => setTool('length')}
          title="Đo kích thước khoảng cách (chiều dài)"
        >
          📏 Đo khoảng cách
        </button>
        <button
          className={`${styles.toolBtn} ${tool === 'area' ? styles.activeTool : ''}`}
          onClick={() => setTool('area')}
          title="Khoanh vùng hình chữ nhật để đo diện tích"
        >
          🟧 Đo diện tích
        </button>
      </div>

      {/* Tỷ lệ hiện tại */}
      <div className={styles.scaleIndicator}>
        ℹ️ Tỷ lệ xích hiện tại:{' '}
        <strong>
          1.0m = {activeDrawing.scale.toFixed(1)} pixel
        </strong>{' '}
        (Kích 2 điểm để hiệu chuẩn lại bất cứ lúc nào).
      </div>

      {/* Vùng Canvas hiển thị */}
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={650}
          height={480}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`${styles.canvas} ${
            tool === 'pan'
              ? isDrawing
                ? styles.grabbing
                : styles.grab
              : styles.crosshair
          }`}
        />
      </div>

      {/* Danh sách các số đo đã thực hiện bên dưới */}
      <div className={styles.measurementsSection}>
        <h4>📏 Số đo đã bóc tách từ bản vẽ</h4>
        <div className={styles.measurementsList}>
          {activeDrawing.measurements.length > 0 ? (
            activeDrawing.measurements.map((m) => (
              <div key={m.id} className={styles.measItem}>
                <span
                  className={styles.measColorIndicator}
                  style={{ backgroundColor: m.color }}
                />
                <div className={styles.measInfo}>
                  <input
                    type="text"
                    value={m.label}
                    onChange={(e) => {
                      const updatedMeas = { ...m, label: e.target.value };
                      // Cập nhật nhãn
                      activeDrawing.measurements = activeDrawing.measurements.map((item) =>
                        item.id === m.id ? updatedMeas : item
                      );
                      // Trigger re-render bằng cách thay đổi scale nhỏ hoặc set lại state
                      onUpdateDrawingScale(activeDrawing.id, activeDrawing.scale);
                    }}
                    className={styles.measLabelInput}
                  />
                  <span className={styles.measValue}>
                    {m.value.toFixed(3)} {m.type === 'linear' ? 'm' : 'm²'}
                  </span>
                </div>
                <div className={styles.measActions}>
                  <button
                    title="Chuyển số đo này sang Bảng BOQ để tính tiền"
                    className={styles.useBtn}
                    onClick={() =>
                      onSetActiveMeasurementForBOQ({
                        label: m.label,
                        value: m.value,
                      })
                    }
                  >
                    👉 Dán BOQ
                  </button>
                  <button
                    title="Xóa số đo"
                    className={styles.deleteMeasBtn}
                    onClick={() => onDeleteMeasurement(activeDrawing.id, m.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyMeas}>
              Chưa có số đo nào. Chọn công cụ đo khoảng cách hoặc diện tích và vẽ trực tiếp lên bản vẽ ở trên!
            </div>
          )}
        </div>
      </div>

      {/* Modal nhập khoảng cách để hiệu chuẩn tỷ lệ xích */}
      {showCalibrateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>📐 Thiết lập Tỷ lệ xích Bản vẽ</h3>
            <p>
              Hệ thống đo được khoảng cách giữa 2 điểm này trên màn hình là:{' '}
              <strong>{tempPixelDistance.toFixed(0)} pixel</strong>.
            </p>
            <div className={styles.formGroup}>
              <label htmlFor="real-dist">Nhập chiều dài thực tế (mét):</label>
              <input
                type="number"
                id="real-dist"
                value={realDistanceInput}
                onChange={(e) => setRealDistanceInput(e.target.value)}
                placeholder="VD: 5.0"
                step="0.1"
                min="0.1"
              />
            </div>
            <p className={styles.modalHelp}>
              Hệ thống sẽ tính toán lại: 1 mét ={' '}
              <strong>
                {(tempPixelDistance / (parseFloat(realDistanceInput) || 1)).toFixed(1)} px
              </strong>
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalSaveBtn} onClick={handleSaveCalibration}>
                Áp dụng tỷ lệ
              </button>
              <button
                className={styles.modalCancelBtn}
                onClick={() => {
                  setShowCalibrateModal(false);
                  setTool('pan');
                }}
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
