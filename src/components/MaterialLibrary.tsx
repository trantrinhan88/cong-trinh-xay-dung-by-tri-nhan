import React, { useState } from 'react';
import { Material } from '../types';
import styles from './MaterialLibrary.module.css';

interface MaterialLibraryProps {
  materials: Material[];
  onAddMaterial: (material: Material) => void;
  onUpdateMaterial: (material: Material) => void;
  onDeleteMaterial: (id: string) => void;
}

export const defaultMaterials: Material[] = [
  { id: 'm1', name: 'Bê tông thương phẩm Mác 250 R28', unit: 'm3', defaultPrice: 1350000, category: 'Bê tông' },
  { id: 'm2', name: 'Cát vàng đổ bê tông', unit: 'm3', defaultPrice: 380000, category: 'Cát đá xi măng' },
  { id: 'm3', name: 'Đá 1x2 đổ bê tông', unit: 'm3', defaultPrice: 420000, category: 'Cát đá xi măng' },
  { id: 'm4', name: 'Xi măng Hoàng Thạch PCB40', unit: 'kg', defaultPrice: 1650, category: 'Cát đá xi măng' },
  { id: 'm5', name: 'Thép cuộn Hòa Phát phi 6 - phi 8', unit: 'kg', defaultPrice: 16500, category: 'Thép' },
  { id: 'm6', name: 'Thép thanh vằn Hòa Phát phi 10 - phi 25', unit: 'kg', defaultPrice: 17200, category: 'Thép' },
  { id: 'm7', name: 'Gạch đặc 6x10.5x22 A1', unit: 'viên', defaultPrice: 1800, category: 'Gạch xây' },
  { id: 'm8', name: 'Gạch tuynel 2 lỗ 8x8x18', unit: 'viên', defaultPrice: 1200, category: 'Gạch xây' },
  { id: 'm9', name: 'Sơn lót kháng kiềm Dulux nội thất', unit: 'm2', defaultPrice: 28000, category: 'Sơn nước' },
  { id: 'm10', name: 'Sơn phủ màu Dulux nội thất (2 lớp)', unit: 'm2', defaultPrice: 48000, category: 'Sơn nước' },
  { id: 'm11', name: 'Nhân công đổ bê tông móng', unit: 'm3', defaultPrice: 450000, category: 'Nhân công' },
  { id: 'm12', name: 'Nhân công gia công lắp dựng cốt thép', unit: 'kg', defaultPrice: 3500, category: 'Nhân công' },
  { id: 'm13', name: 'Nhân công xây tường gạch ống', unit: 'm3', defaultPrice: 650000, category: 'Nhân công' },
  { id: 'm14', name: 'Nhân công trát tường phẳng', unit: 'm2', defaultPrice: 110000, category: 'Nhân công' },
  { id: 'm15', name: 'Đá Granite lát bậc cấp Kim Sa Trung', unit: 'm2', defaultPrice: 1150000, category: 'Hoàn thiện' },
];

export const categories = [
  'Tất cả',
  'Bê tông',
  'Cát đá xi măng',
  'Thép',
  'Gạch xây',
  'Sơn nước',
  'Nhân công',
  'Hoàn thiện',
];

export default function MaterialLibrary({
  materials,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
}: MaterialLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  
  // Trạng thái cho Form Thêm/Sửa
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'm3',
    defaultPrice: 0,
    category: 'Bê tông',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'defaultPrice' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (isEditing && editingId) {
      onUpdateMaterial({
        id: editingId,
        ...formData,
      });
      setIsEditing(false);
      setEditingId(null);
    } else {
      onAddMaterial({
        id: 'mat_' + Date.now(),
        ...formData,
      });
    }

    // Reset Form
    setFormData({
      name: '',
      unit: 'm3',
      defaultPrice: 0,
      category: 'Bê tông',
    });
  };

  const handleEditClick = (mat: Material) => {
    setIsEditing(true);
    setEditingId(mat.id);
    setFormData({
      name: mat.name,
      unit: mat.unit,
      defaultPrice: mat.defaultPrice,
      category: mat.category || 'Bê tông',
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      unit: 'm3',
      defaultPrice: 0,
      category: 'Bê tông',
    });
  };

  // Lọc danh sách vật tư theo từ khóa tìm kiếm và danh mục
  const filteredMaterials = materials.filter((mat) => {
    const matchesSearch = mat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Tất cả' || mat.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>📚 Thư viện Vật tư & Đơn giá</h3>
        <p className={styles.subtitle}>Quản lý danh mục định mức đơn giá vật liệu, nhân công và thiết bị</p>
      </div>

      <div className={styles.content}>
        {/* Form Thêm/Sửa Vật Tư */}
        <div className={styles.formCard}>
          <h4>{isEditing ? '✏️ Cập nhật Vật tư' : '➕ Thêm Vật tư mới'}</h4>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Tên vật tư / nhân công</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ví dụ: Bê tông thương phẩm mác 250"
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label htmlFor="unit">Đơn vị tính</label>
                <select id="unit" name="unit" value={formData.unit} onChange={handleInputChange}>
                  <option value="m3">m³ (Khối)</option>
                  <option value="m2">m² (Diện tích)</option>
                  <option value="md">md (Mét dài)</option>
                  <option value="kg">kg (Cân)</option>
                  <option value="tấn">tấn (Khối lượng)</option>
                  <option value="viên">viên (Số lượng)</option>
                  <option value="cái">cái (Số lượng)</option>
                  <option value="công">công (Nhân công)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category">Phân loại</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categories.slice(1).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="defaultPrice">Đơn giá gốc (VND)</label>
              <input
                type="number"
                id="defaultPrice"
                name="defaultPrice"
                value={formData.defaultPrice === 0 ? '' : formData.defaultPrice}
                onChange={handleInputChange}
                placeholder="Nhập số tiền..."
                min="0"
                required
              />
              <span className={styles.pricePreview}>
                = {formData.defaultPrice.toLocaleString('vi-VN')} VND / {formData.unit}
              </span>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn}>
                {isEditing ? 'Cập nhật' : 'Thêm vào thư viện'}
              </button>
              {isEditing && (
                <button type="button" className={styles.cancelBtn} onClick={handleCancelEdit}>
                  Hủy bỏ
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Bảng Danh Sách Vật Tư */}
        <div className={styles.listCard}>
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              🔍
              <input
                type="text"
                placeholder="Tìm nhanh vật tư..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className={styles.categoryTabs}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.tab} ${selectedCategory === cat ? styles.activeTab : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên vật tư</th>
                  <th>Phân loại</th>
                  <th>Đơn vị</th>
                  <th style={{ textAlign: 'right' }}>Đơn giá (VND)</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.length > 0 ? (
                  filteredMaterials.map((mat) => (
                    <tr key={mat.id}>
                      <td className={styles.matName}>{mat.name}</td>
                      <td>
                        <span className={`${styles.catBadge} cat_${mat.category?.replace(/\s/g, '_')}`}>
                          {mat.category}
                        </span>
                      </td>
                      <td className={styles.mono}>{mat.unit}</td>
                      <td className={`${styles.mono} ${styles.priceText}`} style={{ textAlign: 'right' }}>
                        {mat.defaultPrice.toLocaleString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className={styles.actions}>
                          <button
                            title="Sửa đơn giá"
                            className={styles.editBtn}
                            onClick={() => handleEditClick(mat)}
                          >
                            ✏️
                          </button>
                          <button
                            title="Xóa vật tư"
                            className={styles.deleteBtn}
                            onClick={() => onDeleteMaterial(mat.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>
                      Không tìm thấy vật tư nào khớp với từ khóa tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
