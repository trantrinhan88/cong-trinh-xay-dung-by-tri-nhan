import React, { useState } from 'react';
import { BOQItem, Material } from '../types';
import { parseFormula } from '../utils/formulaParser';
import styles from './BOQTable.module.css';

interface BOQTableProps {
  items: BOQItem[];
  materials: Material[];
  onItemsChange: (items: BOQItem[]) => void;
  activeMeasurement?: { label: string; value: number } | null;
  onClearActiveMeasurement?: () => void;
}

export default function BOQTable({
  items,
  materials,
  onItemsChange,
  activeMeasurement,
  onClearActiveMeasurement,
}: BOQTableProps) {
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  // Helper tìm kiếm vật tư liên kết
  const getMaterial = (materialId?: string): Material | undefined => {
    if (!materialId) return undefined;
    return materials.find((m) => m.id === materialId);
  };

  // Cập nhật giá trị của một ô trong hàng
  const handleCellChange = (
    id: string,
    field: keyof BOQItem,
    value: string | number | undefined
  ) => {
    const updatedItems = items.map((item) => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };

      // Nếu thay đổi công thức diễn giải -> tự động tính toán lại khối lượng
      if (field === 'explanationFormula') {
        const { quantity } = parseFormula(value as string);
        updatedItem.calculatedQuantity = quantity;
      }

      // Tính lại thành tiền
      const material = getMaterial(updatedItem.materialId);
      const unitPrice =
        updatedItem.customPrice !== undefined && updatedItem.customPrice !== null
          ? updatedItem.customPrice
          : material
          ? material.defaultPrice
          : 0;

      updatedItem.totalAmount = updatedItem.calculatedQuantity * unitPrice;

      return updatedItem;
    });

    onItemsChange(updatedItems);
  };

  // Thay đổi vật tư liên kết cho hàng
  const handleMaterialChange = (id: string, materialId: string) => {
    const updatedItems = items.map((item) => {
      if (item.id !== id) return item;

      const newMaterialId = materialId === '' ? undefined : materialId;
      const material = materials.find((m) => m.id === newMaterialId);
      
      const updatedItem = {
        ...item,
        materialId: newMaterialId,
      };

      // Nếu thay đổi vật tư, đặt đơn giá tuỳ biến thành mặc định (hủy override ban đầu nếu muốn,
      // hoặc giữ nguyên. Ở đây chúng ta sẽ xóa customPrice để dùng đơn giá mặc định của vật tư mới)
      updatedItem.customPrice = undefined;

      const unitPrice = material ? material.defaultPrice : 0;
      updatedItem.totalAmount = updatedItem.calculatedQuantity * unitPrice;

      return updatedItem;
    });

    onItemsChange(updatedItems);
  };

  // Thêm một hàng mới trống
  const handleAddRow = () => {
    const newItem: BOQItem = {
      id: 'boq_' + Date.now(),
      projectId: 'proj_default',
      code: '',
      descriptionName: '',
      explanationFormula: '',
      calculatedQuantity: 0,
      totalAmount: 0,
    };
    onItemsChange([...items, newItem]);
    setActiveRowId(newItem.id);
  };

  // Sao chép một hàng hiện có (tiện ích cực cao cho kỹ sư)
  const handleCloneRow = (item: BOQItem) => {
    const clonedItem: BOQItem = {
      ...item,
      id: 'boq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      descriptionName: `${item.descriptionName} (Bản sao)`,
    };
    onItemsChange([...items, clonedItem]);
  };

  // Xóa một hàng
  const handleDeleteRow = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id));
    if (activeRowId === id) {
      setActiveRowId(null);
    }
  };

  // Chèn số đo đo đạc từ bản vẽ kỹ thuật vào dòng đang hoạt động
  const handlePasteMeasurement = (rowId: string) => {
    if (!activeMeasurement) return;

    const targetItem = items.find((item) => item.id === rowId);
    if (!targetItem) return;

    // Định dạng chuỗi đo đạc: "Mô tả số đo: Giá trị"
    const measurementStr = `${activeMeasurement.label}: ${activeMeasurement.value.toFixed(2)}`;
    
    // Nếu dòng đang trống thì điền luôn, nếu có nội dung rồi thì nối tiếp bằng dấu cộng
    const currentFormula = targetItem.explanationFormula;
    let newFormula = '';
    if (!currentFormula || currentFormula.trim() === '') {
      newFormula = measurementStr;
    } else {
      // Kiểm tra nếu có dấu hai chấm thì chèn giá trị tính toán vào sau dấu hai chấm
      const colonIndex = currentFormula.lastIndexOf(':');
      if (colonIndex !== -1) {
        newFormula = `${currentFormula} + ${activeMeasurement.value.toFixed(2)}`;
      } else {
        newFormula = `${currentFormula} + ${activeMeasurement.value.toFixed(2)}`;
      }
    }

    handleCellChange(rowId, 'explanationFormula', newFormula);

    if (onClearActiveMeasurement) {
      onClearActiveMeasurement();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h3>📝 Bảng Tính Toán Khối Lượng (BOQ)</h3>
          <p className={styles.subtitle}>Nhập diễn giải công thức số lượng và liên kết đơn giá vật tư</p>
        </div>
        <button className={styles.addBtn} onClick={handleAddRow}>
          ➕ Thêm Hạng mục mới
        </button>
      </div>

      {/* Thông báo nếu có số đo sẵn sàng dán */}
      {activeMeasurement && (
        <div className={styles.measurementAlert}>
          <span className={styles.alertIcon}>📏</span>
          <div className={styles.alertText}>
            <strong>Số đo sẵn sàng:</strong> &quot;{activeMeasurement.label}&quot; ={' '}
            <code className={styles.alertCode}>{activeMeasurement.value.toFixed(3)}</code>. Kích vào biểu tượng{' '}
            <span className={styles.pasteIndicatorBtn}>📋</span> tại hàng bất kỳ để dán vào công thức!
          </div>
          <button className={styles.clearAlertBtn} onClick={onClearActiveMeasurement}>
            Hủy
          </button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Mã hiệu</th>
              <th style={{ width: '220px' }}>Tên hạng mục công việc</th>
              <th style={{ width: '280px' }}>Diễn giải công thức tính toán</th>
              <th style={{ width: '85px', textAlign: 'right' }}>Số lượng</th>
              <th style={{ width: '100px' }}>Đơn vị</th>
              <th style={{ width: '180px' }}>Vật tư liên kết</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Đơn giá (VND)</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Thành tiền (VND)</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => {
                const linkedMat = getMaterial(item.materialId);
                const isPriceOverridden = item.customPrice !== undefined && item.customPrice !== null;
                const activePrice = isPriceOverridden
                  ? item.customPrice!
                  : linkedMat
                  ? linkedMat.defaultPrice
                  : 0;

                const displayUnit = linkedMat ? linkedMat.unit : '---';

                return (
                  <tr
                    key={item.id}
                    className={`${styles.row} ${activeRowId === item.id ? styles.activeRow : ''}`}
                    onClick={() => setActiveRowId(item.id)}
                  >
                    {/* Mã hiệu */}
                    <td>
                      <input
                        type="text"
                        value={item.code || ''}
                        onChange={(e) => handleCellChange(item.id, 'code', e.target.value)}
                        placeholder="VD: AF.11"
                        className={styles.cellInput}
                      />
                    </td>

                    {/* Tên công việc */}
                    <td>
                      <input
                        type="text"
                        value={item.descriptionName}
                        onChange={(e) =>
                          handleCellChange(item.id, 'descriptionName', e.target.value)
                        }
                        placeholder="Nhập tên hạng mục..."
                        className={`${styles.cellInput} ${styles.boldText}`}
                      />
                    </td>

                    {/* Diễn giải công thức */}
                    <td>
                      <div className={styles.formulaWrapper}>
                        <input
                          type="text"
                          value={item.explanationFormula}
                          onChange={(e) =>
                            handleCellChange(item.id, 'explanationFormula', e.target.value)
                          }
                          placeholder="Móng M1: 2 * 3.5 * 1.2 * 0.4"
                          className={`${styles.cellInput} ${styles.mono}`}
                        />
                        {activeMeasurement && (
                          <button
                            title={`Dán số đo: ${activeMeasurement.value.toFixed(2)}`}
                            className={styles.pasteBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePasteMeasurement(item.id);
                            }}
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Số lượng tính toán */}
                    <td className={`${styles.mono} ${styles.quantityCell}`} style={{ textAlign: 'right' }}>
                      {item.calculatedQuantity.toLocaleString('vi-VN', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 3,
                      })}
                    </td>

                    {/* Đơn vị */}
                    <td className={styles.unitCell}>
                      <span className={styles.unitBadge}>{displayUnit}</span>
                    </td>

                    {/* Liên kết vật tư */}
                    <td>
                      <select
                        value={item.materialId || ''}
                        onChange={(e) => handleMaterialChange(item.id, e.target.value)}
                        className={styles.cellSelect}
                      >
                        <option value="">-- Chọn vật tư áp giá --</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.unit})
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Đơn giá */}
                    <td>
                      <div className={styles.priceCellWrapper}>
                        <input
                          type="number"
                          value={isPriceOverridden ? item.customPrice : linkedMat ? linkedMat.defaultPrice : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            handleCellChange(item.id, 'customPrice', val);
                          }}
                          placeholder={linkedMat ? linkedMat.defaultPrice.toString() : '0'}
                          className={`${styles.cellInput} ${styles.mono}`}
                          style={{ textAlign: 'right' }}
                        />
                        {item.materialId && (
                          <span
                            className={`${styles.priceBadge} ${
                              isPriceOverridden ? styles.overrideBadge : styles.defaultPriceBadge
                            }`}
                            title={isPriceOverridden ? 'Đơn giá đã được sửa đổi thủ công' : 'Đơn giá lấy từ thư viện'}
                          >
                            {isPriceOverridden ? 'T.Biến' : 'M.Định'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Thành tiền */}
                    <td className={`${styles.mono} ${styles.amountCell}`} style={{ textAlign: 'right' }}>
                      {item.totalAmount.toLocaleString('vi-VN')}
                    </td>

                    {/* Hành động */}
                    <td style={{ textAlign: 'center' }}>
                      <div className={styles.rowActions}>
                        <button
                          title="Nhân bản hàng"
                          className={styles.cloneRowBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloneRow(item);
                          }}
                        >
                          👥
                        </button>
                        <button
                          title="Xóa hàng"
                          className={styles.deleteRowBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(item.id);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className={styles.emptyRow}>
                  Chưa có hạng mục công việc nào. Kích <strong>&quot;Thêm Hạng mục mới&quot;</strong> để bắt đầu tính toán!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <div className={styles.totalStats}>
          <span>Hạng mục: <strong>{items.length}</strong></span>
          <span>Khối lượng cộng dồn: <strong>
            {items.reduce((acc, curr) => acc + curr.calculatedQuantity, 0).toLocaleString('vi-VN', {
              maximumFractionDigits: 3,
            })}
          </strong></span>
        </div>
        <div className={styles.grandSubtotal}>
          Tổng tiền vật tư: 
          <span className={styles.grandPrice}>
            {items.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString('vi-VN')} VND
          </span>
        </div>
      </div>
    </div>
  );
}
