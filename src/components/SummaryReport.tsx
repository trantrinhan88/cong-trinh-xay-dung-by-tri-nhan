import React, { useState } from 'react';
import { BOQItem, Material } from '../types';
import styles from './SummaryReport.module.css';

interface SummaryReportProps {
  items: BOQItem[];
  materials: Material[];
  onImportProject: (projectData: any) => void;
  exportProjectData: () => any;
}

export default function SummaryReport({
  items,
  materials,
  onImportProject,
  exportProjectData,
}: SummaryReportProps) {
  // Các hệ số định mức kinh phí (%) theo quy định Bộ Xây Dựng (cho phép tùy biến)
  const [indirectRate, setIndirectRate] = useState(6.0); // Chi phí gián tiếp (6%)
  const [profitRate, setProfitRate] = useState(5.5); // Thu nhập chịu thuế tính trước (5.5%)
  const [vatRate, setVatRate] = useState(10.0); // Thuế giá trị gia tăng (10% hoặc 8%)
  const [contingencyRate, setContingencyRate] = useState(5.0); // Chi phí dự phòng (5%)

  // 1. Tính chi phí vật tư trực tiếp (T)
  const directCost = items.reduce((acc, curr) => acc + curr.totalAmount, 0);

  // 2. Tính toán các hạng mục chi phí theo hệ số
  const indirectCost = directCost * (indirectRate / 100); // Chi phí gián tiếp (GT = T * %)
  const subtotalBeforeProfit = directCost + indirectCost; // Chi phí xây dựng trước thuế (T + GT)
  
  const calculatedProfit = subtotalBeforeProfit * (profitRate / 100); // Thu nhập chịu thuế tính trước (TL = (T + GT) * %)
  const subtotalBeforeVat = subtotalBeforeProfit + calculatedProfit; // Tổng trước thuế (T + GT + TL)

  const calculatedVat = subtotalBeforeVat * (vatRate / 100); // Thuế VAT (VAT = Tổng trước thuế * %)
  const subtotalWithVat = subtotalBeforeVat + calculatedVat; // Chi phí xây dựng sau thuế

  const calculatedContingency = subtotalWithVat * (contingencyRate / 100); // Chi phí dự phòng (DP = Sau thuế * %)
  const grandTotal = subtotalWithVat + calculatedContingency; // TỔNG CỘNG DỰ TOÁN CÔNG TRÌNH

  // 3. Phân nhóm chi phí theo danh mục vật tư để hiển thị biểu đồ
  const categoryBreakdown = items.reduce((acc: { [key: string]: number }, item) => {
    const mat = materials.find((m) => m.id === item.materialId);
    const catName = mat?.category || 'Chưa phân loại';
    acc[catName] = (acc[catName] || 0) + item.totalAmount;
    return acc;
  }, {});

  const totalItemCost = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0) || 1;

  // Sắp xếp các danh mục từ lớn đến bé
  const sortedCategories = Object.entries(categoryBreakdown)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: (amount / totalItemCost) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Lấy màu sắc tương ứng cho danh mục biểu đồ
  const getCategoryColor = (name: string): string => {
    switch (name) {
      case 'Bê tông': return '#ef4444';
      case 'Cát đá xi măng': return '#f59e0b';
      case 'Thép': return '#0284c7';
      case 'Gạch xây': return '#ea580c';
      case 'Sơn nước': return '#c084fc';
      case 'Nhân công': return '#10b981';
      case 'Hoàn thiện': return '#6366f1';
      default: return '#94a3b8';
    }
  };

  // Trình kích hoạt tải file JSON dự án lên
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.boqItems && parsed.drawings) {
          onImportProject(parsed);
          alert('📥 Đã tải lên dự án thành công!');
        } else {
          alert('❌ File JSON không đúng định dạng cấu trúc dự án dự toán.');
        }
      } catch (err) {
        alert('❌ Lỗi đọc file JSON. Vui lòng kiểm tra lại file.');
      }
    };
    reader.readAsText(file);
  };

  // Trình kích hoạt tải file JSON dự án xuống
  const handleFileExport = () => {
    const data = exportProjectData();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute('download', `Dự-toán-công-trình-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Trình in ấn báo cáo dự toán
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3>📊 Bảng Tổng Hợp Kinh Phí Xây Dựng</h3>
          <p className={styles.subtitle}>Tổng hợp toàn bộ dự toán chi phí, thuế, hệ số gián tiếp và dự phòng phát sinh</p>
        </div>
        
        <div className={styles.fileControls}>
          <button className={styles.exportBtn} onClick={handleFileExport} title="Tải file dự án về máy tính">
            💾 Lưu Dự Án (.json)
          </button>
          
          <label className={styles.importLabel} title="Tải file dự án cũ lên">
            📥 Tải Dự Án Lên
            <input type="file" onChange={handleFileImport} accept=".json" style={{ display: 'none' }} />
          </label>

          <button className={styles.printBtn} onClick={handlePrint} title="In bảng tổng hợp ra giấy hoặc PDF">
            🖨️ In Báo Cáo
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Bảng Chi Tiết Tổng Hợp Thuế Phí */}
        <div className={styles.tableCard}>
          <div className={styles.sectionTitle}>
            <h4>📋 Bảng Tổng Hợp Dự Toán Kinh Phí Xây Dựng</h4>
            <span className={styles.badgeText}>Tiêu chuẩn Bộ Xây Dựng Việt Nam</span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>STT</th>
                  <th>Khoản mục chi phí</th>
                  <th style={{ width: '120px' }}>Cách tính / Hệ số</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Giá trị (VND)</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Chi phí trực tiếp */}
                <tr>
                  <td>1</td>
                  <td className={styles.boldRow}>Chi phí vật tư trực tiếp (T)</td>
                  <td className={styles.mono}>Tổng BOQ</td>
                  <td className={`${styles.mono} ${styles.boldRow}`} style={{ textAlign: 'right' }}>
                    {directCost.toLocaleString('vi-VN')}
                  </td>
                </tr>

                {/* 2. Chi phí gián tiếp */}
                <tr>
                  <td>2</td>
                  <td>Chi phí gián tiếp (GT)</td>
                  <td>
                    <div className={styles.rateEditor}>
                      T * 
                      <input
                        type="number"
                        value={indirectRate}
                        onChange={(e) => setIndirectRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className={styles.rateInput}
                        step="0.1"
                      />
                      %
                    </div>
                  </td>
                  <td className={styles.mono} style={{ textAlign: 'right' }}>
                    {indirectCost.toLocaleString('vi-VN')}
                  </td>
                </tr>

                {/* 3. Thu nhập chịu thuế tính trước */}
                <tr>
                  <td>3</td>
                  <td>Thu nhập chịu thuế tính trước (TL)</td>
                  <td>
                    <div className={styles.rateEditor}>
                      (T+GT) * 
                      <input
                        type="number"
                        value={profitRate}
                        onChange={(e) => setProfitRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className={styles.rateInput}
                        step="0.1"
                      />
                      %
                    </div>
                  </td>
                  <td className={styles.mono} style={{ textAlign: 'right' }}>
                    {calculatedProfit.toLocaleString('vi-VN')}
                  </td>
                </tr>

                {/* Tổng trước thuế */}
                <tr className={styles.subtotalRow}>
                  <td></td>
                  <td className={styles.boldRow}>Tổng chi phí xây dựng trước thuế</td>
                  <td className={styles.mono}>T + GT + TL</td>
                  <td className={`${styles.mono} ${styles.boldRow}`} style={{ textAlign: 'right' }}>
                    {subtotalBeforeVat.toLocaleString('vi-VN')}
                  </td>
                </tr>

                {/* 4. Thuế giá trị gia tăng */}
                <tr>
                  <td>4</td>
                  <td>Thuế giá trị gia tăng (VAT)</td>
                  <td>
                    <div className={styles.rateEditor}>
                      Trước thuế * 
                      <input
                        type="number"
                        value={vatRate}
                        onChange={(e) => setVatRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className={styles.rateInput}
                        step="1"
                      />
                      %
                    </div>
                  </td>
                  <td className={styles.mono} style={{ textAlign: 'right' }}>
                    {calculatedVat.toLocaleString('vi-VN')}
                  </td>
                </tr>

                {/* Tổng sau thuế */}
                <tr>
                  <td></td>
                  <td>Chi phí xây dựng sau thuế</td>
                  <td className={styles.mono}>Trước thuế + VAT</td>
                  <td className={styles.mono} style={{ textAlign: 'right' }}>
                    {subtotalWithVat.toLocaleString('vi-VN')}
                  </td>
                </tr>

                {/* 5. Chi phí dự phòng */}
                <tr>
                  <td>5</td>
                  <td>Chi phí dự phòng phát sinh (DP)</td>
                  <td>
                    <div className={styles.rateEditor}>
                      Sau thuế * 
                      <input
                        type="number"
                        value={contingencyRate}
                        onChange={(e) => setContingencyRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className={styles.rateInput}
                        step="0.5"
                      />
                      %
                    </div>
                  </td>
                  <td className={styles.mono} style={{ textAlign: 'right' }}>
                    {calculatedContingency.toLocaleString('vi-VN')}
                  </td>
                </tr>

                {/* TỔNG CỘNG CUỐI CÙNG */}
                <tr className={styles.grandTotalRow}>
                  <td></td>
                  <td className={styles.grandLabel}>TỔNG DỰ TOÁN CÔNG TRÌNH (G.TOTAL)</td>
                  <td className={styles.mono}>Sau thuế + DP</td>
                  <td className={`${styles.mono} ${styles.grandValue}`} style={{ textAlign: 'right' }}>
                    {grandTotal.toLocaleString('vi-VN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Biểu Đồ Trực Quan Tỷ Trọng Vật Tư */}
        <div className={styles.chartCard}>
          <h4>📊 Phân bổ Chi phí Vật tư</h4>
          <p className={styles.chartSubtitle}>Biểu đồ tỷ lệ chi phí theo phân loại vật tư trong dự án</p>
          
          <div className={styles.chartContainer}>
            {sortedCategories.length > 0 ? (
              <div className={styles.chartList}>
                {sortedCategories.map((cat) => (
                  <div key={cat.name} className={styles.chartItem}>
                    <div className={styles.chartItemHeader}>
                      <span className={styles.catName}>
                        <span
                          className={styles.dot}
                          style={{ backgroundColor: getCategoryColor(cat.name) }}
                        />
                        {cat.name}
                      </span>
                      <span className={styles.catVal}>
                        {cat.amount.toLocaleString('vi-VN')} VND ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    {/* Thanh phần trăm Bar chart */}
                    <div className={styles.barOuter}>
                      <div
                        className={styles.barInner}
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: getCategoryColor(cat.name),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyChart}>
                Chưa có dữ liệu vật tư để hiển thị biểu đồ. Vui lòng thêm hạng mục và liên kết vật tư ở bảng BOQ!
              </div>
            )}
          </div>

          <div className={styles.summaryHighlight}>
            <div className={styles.highlightBox}>
              <span className={styles.hlTitle}>💸 Chi phí trực tiếp</span>
              <span className={styles.hlVal}>{directCost.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className={styles.highlightBox}>
              <span className={styles.hlTitle}>🛡️ Thuế & Chi phí phụ</span>
              <span className={styles.hlVal}>{(grandTotal - directCost).toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
