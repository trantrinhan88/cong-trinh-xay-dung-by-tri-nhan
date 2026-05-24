'use client';

import React, { useState, useEffect } from 'react';
import { Project, Material, BOQItem, Drawing, Measurement } from '../types';
import DrawingViewer from '../components/DrawingViewer';
import BOQTable from '../components/BOQTable';
import MaterialLibrary, { defaultMaterials } from '../components/MaterialLibrary';
import SummaryReport from '../components/SummaryReport';
import styles from './page.module.css';

// Dự án mẫu được khởi tạo ban đầu để người dùng dễ tiếp cận
const sampleProject: Project = {
  id: 'proj_sample',
  name: 'Nhà Phố Hiện Đại 2 Tầng - Anh Nam',
  location: 'Khu Đô Thị Sala, Quận 2, TP. Hồ Chí Minh',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  drawings: [
    {
      id: 'drawing_mong',
      name: 'Mặt bằng kết cấu Móng',
      url: '',
      scale: 50.0, // 1 mét = 50 pixel
      measurements: [
        {
          id: 'm_sample_1',
          type: 'linear',
          points: [{ x: 100, y: 100 }, { x: 250, y: 100 }],
          value: 3.0,
          label: 'Đo Khoảng cách Trục A - B',
          color: '#10b981',
        },
        {
          id: 'm_sample_2',
          type: 'area',
          points: [{ x: 100, y: 100 }, { x: 250, y: 250 }],
          value: 9.0,
          label: 'Diện tích Móng góc A1',
          color: '#f59e0b',
        }
      ],
    },
    {
      id: 'drawing_tuong',
      name: 'Mặt bằng xây dựng Tầng 1',
      url: '',
      scale: 40.0, // 1 mét = 40 pixel
      measurements: [],
    },
    {
      id: 'drawing_dam',
      name: 'Chi tiết cốt thép Dầm D1',
      url: '',
      scale: 60.0, // 1 mét = 60 pixel
      measurements: [],
    },
  ],
  activeDrawingId: 'drawing_mong',
  boqItems: [
    {
      id: 'boq_s1',
      projectId: 'proj_sample',
      code: 'AF.11111',
      descriptionName: 'Đổ bê tông móng M1 mác 250 R28',
      explanationFormula: 'Móng vuông M1: 6 * 1.2 * 1.2 * 0.6',
      calculatedQuantity: 5.184,
      materialId: 'm1', // Liên kết Bê tông tươi
      totalAmount: 5.184 * 1350000,
    },
    {
      id: 'boq_s2',
      projectId: 'proj_sample',
      code: 'AF.12345',
      descriptionName: 'Gia công lắp dựng cốt thép dầm dọc D1',
      explanationFormula: 'Thép phi 20 dọc chủ: 4 * 6.5 * 2.47 (kg/m)',
      calculatedQuantity: 64.22,
      materialId: 'm6', // Liên kết Thép thanh vằn
      totalAmount: 64.22 * 17200,
    },
    {
      id: 'boq_s3',
      projectId: 'proj_sample',
      code: 'AX.11022',
      descriptionName: 'Nhân công xây trát tường phẳng bao che d220',
      explanationFormula: 'Tường trục A-D (Trừ cửa): 2 * (6.5 + 4.0) * 3.5 - 2.0 * 2.2',
      calculatedQuantity: 69.1,
      materialId: 'm14', // Liên kết Nhân công trát
      totalAmount: 69.1 * 110000,
    },
    {
      id: 'boq_s4',
      projectId: 'proj_sample',
      code: 'HT.012',
      descriptionName: 'Sơn phủ màu Dulux nội thất hoàn thiện phẳng',
      explanationFormula: 'Diện tích hai mặt trong nhà: 69.1 * 2',
      calculatedQuantity: 138.2,
      materialId: 'm10', // Liên kết Sơn phủ Dulux
      totalAmount: 138.2 * 48000,
    },
  ],
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'library' | 'report'>('workspace');
  const [materials, setMaterials] = useState<Material[]>(defaultMaterials);
  const [projects, setProjects] = useState<Project[]>([sampleProject]);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj_sample');
  const [activeMeasurement, setActiveMeasurement] = useState<{ label: string; value: number } | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // 1. Tải dữ liệu từ LocalStorage khi khởi chạy
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedMaterials = localStorage.getItem('ai_boq_materials');
      const storedProjects = localStorage.getItem('ai_boq_projects');
      const storedActiveId = localStorage.getItem('ai_boq_active_project_id');

      if (storedMaterials) {
        setMaterials(JSON.parse(storedMaterials));
      }
      if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
      }
      if (storedActiveId) {
        setActiveProjectId(storedActiveId);
      }
    }
  }, []);

  // 2. Lưu dữ liệu tự động vào LocalStorage khi thay đổi
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_boq_materials', JSON.stringify(materials));
    }
  }, [materials]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_boq_projects', JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_boq_active_project_id', activeProjectId);
    }
  }, [activeProjectId]);

  // Lấy dự án hiện tại
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

  // Trình cập nhật dự án hiện tại
  const updateActiveProject = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? { ...updatedProject, updatedAt: new Date().toISOString() } : p))
    );
  };

  // Cập nhật các dòng BOQ trong dự án hiện tại
  const handleBOQItemsChange = (items: BOQItem[]) => {
    updateActiveProject({
      ...activeProject,
      boqItems: items,
    });
  };

  // Thay đổi bản vẽ đang xem
  const handleSelectDrawing = (drawingId: string) => {
    updateActiveProject({
      ...activeProject,
      activeDrawingId: drawingId,
    });
  };

  // Thêm bản vẽ mới tự tải lên
  const handleAddDrawing = (newDrawing: Drawing) => {
    updateActiveProject({
      ...activeProject,
      drawings: [...activeProject.drawings, newDrawing],
      activeDrawingId: newDrawing.id,
    });
  };

  // Cập nhật tỷ lệ xích bản vẽ sau hiệu chuẩn
  const handleUpdateDrawingScale = (drawingId: string, scale: number) => {
    updateActiveProject({
      ...activeProject,
      drawings: activeProject.drawings.map((d) => (d.id === drawingId ? { ...d, scale } : d)),
    });
  };

  // Thêm số đo mới từ Canvas
  const handleAddMeasurement = (drawingId: string, measurement: Measurement) => {
    updateActiveProject({
      ...activeProject,
      drawings: activeProject.drawings.map((d) =>
        d.id === drawingId ? { ...d, measurements: [...d.measurements, measurement] } : d
      ),
    });
  };

  // Xóa số đo trên bản vẽ
  const handleDeleteMeasurement = (drawingId: string, measurementId: string) => {
    updateActiveProject({
      ...activeProject,
      drawings: activeProject.drawings.map((d) =>
        d.id === drawingId ? { ...d, measurements: d.measurements.filter((m) => m.id !== measurementId) } : d
      ),
    });
  };

  // NHÀN: Xử lý Thư viện vật tư (Material Library)
  const handleAddMaterial = (newMat: Material) => {
    setMaterials((prev) => [...prev, newMat]);
  };

  const handleUpdateMaterial = (updatedMat: Material) => {
    setMaterials((prev) => prev.map((m) => (m.id === updatedMat.id ? updatedMat : m)));
    
    // Cập nhật lại giá của các BOQ đang liên kết vật tư này (nếu không có customPrice)
    const updatedBOQItems = activeProject.boqItems.map((item) => {
      if (item.materialId === updatedMat.id) {
        const activePrice = item.customPrice !== undefined ? item.customPrice : updatedMat.defaultPrice;
        return {
          ...item,
          totalAmount: item.calculatedQuantity * activePrice,
        };
      }
      return item;
    });

    updateActiveProject({
      ...activeProject,
      boqItems: updatedBOQItems,
    });
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('⚠️ Bạn có chắc chắn muốn xóa vật tư này khỏi thư viện gốc? Các hạng mục BOQ đang liên kết sẽ mất đơn giá mặc định.')) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  };

  // Cấu hình import/export file dự án JSON
  const handleImportProject = (importedData: any) => {
    const importedProject: Project = {
      id: importedData.id || 'proj_' + Date.now(),
      name: importedData.name || 'Dự án nhập khẩu',
      location: importedData.location || '',
      createdAt: importedData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      drawings: importedData.drawings || [],
      activeDrawingId: importedData.activeDrawingId || (importedData.drawings?.[0]?.id || ''),
      boqItems: importedData.boqItems || [],
    };

    // Kiểm tra xem dự án đã tồn tại chưa, nếu rồi thì thay thế, chưa thì thêm mới
    const exists = projects.some((p) => p.id === importedProject.id);
    if (exists) {
      setProjects((prev) => prev.map((p) => (p.id === importedProject.id ? importedProject : p)));
    } else {
      setProjects((prev) => [...prev, importedProject]);
    }
    setActiveProjectId(importedProject.id);
  };

  const exportProjectData = () => {
    return activeProject;
  };

  const handleCreateNewProject = () => {
    const newProjId = 'proj_' + Date.now();
    const newProject: Project = {
      id: newProjId,
      name: 'Dự án mới ' + (projects.length + 1),
      location: 'Chưa nhập địa chỉ',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      drawings: [
        {
          id: 'drawing_mong',
          name: 'Mặt bằng kết cấu Móng',
          url: '',
          scale: 50.0,
          measurements: [],
        },
        {
          id: 'drawing_tuong',
          name: 'Mặt bằng xây dựng Tầng 1',
          url: '',
          scale: 40.0,
          measurements: [],
        },
        {
          id: 'drawing_dam',
          name: 'Chi tiết cốt thép Dầm D1',
          url: '',
          scale: 60.0,
          measurements: [],
        },
      ],
      activeDrawingId: 'drawing_mong',
      boqItems: [],
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setActiveProjectId(newProjId);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_boq_projects', JSON.stringify(updatedProjects));
      localStorage.setItem('ai_boq_active_project_id', newProjId);
    }
  };

  const handleSaveAllChanges = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_boq_projects', JSON.stringify(projects));
      localStorage.setItem('ai_boq_materials', JSON.stringify(materials));
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 2000);
    }
  };

  return (
    <div className={styles.appContainer}>
      {/* Thanh Header chính */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>🏛️</span>
          <div>
            <h1>Hỗ trợ tính chi phí công trình xây dựng</h1>
            <span className={styles.authorBadge}>Tác giả: Trần Trí Nhân</span>
          </div>
        </div>

        {/* Thông tin công trình hiện tại */}
        <div className={styles.projectWrapper}>
          <div className={styles.projectMain}>
            <div className={styles.projectSelectorRow}>
              <select
                value={activeProjectId}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className={styles.projectSelectDropdown}
                title="Chọn dự án đang làm việc"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
              <button className={styles.newProjectBtn} onClick={handleCreateNewProject} title="Tạo dự án mới">
                ➕ Tạo mới
              </button>
            </div>

            <div className={styles.projectInfo}>
              <div className={styles.projectTitleRow}>
                <span className={styles.projectLabel}>📍 Dự án:</span>
                <input
                  type="text"
                  value={activeProject.name}
                  onChange={(e) => updateActiveProject({ ...activeProject, name: e.target.value })}
                  className={styles.projectNameInput}
                  placeholder="Nhập tên dự án..."
                  title="Nhập tên dự án"
                />
              </div>
              <div className={styles.projectLocationRow}>
                <span className={styles.projectLocationLabel}>🏢 Địa chỉ:</span>
                <input
                  type="text"
                  value={activeProject.location || ''}
                  onChange={(e) => updateActiveProject({ ...activeProject, location: e.target.value })}
                  className={styles.projectLocationInput}
                  placeholder="Nhập địa chỉ công trình..."
                  title="Nhập địa chỉ"
                />
              </div>
            </div>
          </div>
          <button className={styles.saveProjectBtn} onClick={handleSaveAllChanges} title="Lưu thay đổi toàn bộ dự án">
            💾 Lưu
          </button>
          {showSaveToast && <span className={styles.saveToast}>Đã lưu! ✓</span>}
        </div>

        {/* Thanh chuyển Tab */}
        <nav className={styles.nav}>
          <button
            className={`${styles.navBtn} ${activeTab === 'workspace' ? styles.activeNav : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            📊 Bàn Dự Toán
          </button>
          <button
            className={`${styles.navBtn} ${activeTab === 'library' ? styles.activeNav : ''}`}
            onClick={() => setActiveTab('library')}
          >
            📚 Thư viện Vật tư
          </button>
          <button
            className={`${styles.navBtn} ${activeTab === 'report' ? styles.activeNav : ''}`}
            onClick={() => setActiveTab('report')}
          >
            📈 Tổng hợp Kinh phí
          </button>
        </nav>
      </header>

      {/* Vùng nội dung Workspace hiển thị */}
      <main className={styles.mainContent}>
        {activeTab === 'workspace' && (
          <div className={styles.workspaceGrid}>
            {/* Cột trái: Canvas bản vẽ kĩ thuật */}
            <section className={styles.drawingPane}>
              <DrawingViewer
                drawings={activeProject.drawings}
                activeDrawingId={activeProject.activeDrawingId}
                onSelectDrawing={handleSelectDrawing}
                onAddDrawing={handleAddDrawing}
                onUpdateDrawingScale={handleUpdateDrawingScale}
                onAddMeasurement={handleAddMeasurement}
                onDeleteMeasurement={handleDeleteMeasurement}
                onSetActiveMeasurementForBOQ={setActiveMeasurement}
              />
            </section>

            {/* Cột phải: Bảng dự toán bóc tách BOQ */}
            <section className={styles.tablePane}>
              <BOQTable
                items={activeProject.boqItems}
                materials={materials}
                onItemsChange={handleBOQItemsChange}
                activeMeasurement={activeMeasurement}
                onClearActiveMeasurement={() => setActiveMeasurement(null)}
              />
            </section>
          </div>
        )}

        {activeTab === 'library' && (
          <div className={styles.singlePane}>
            <MaterialLibrary
              materials={materials}
              onAddMaterial={handleAddMaterial}
              onUpdateMaterial={handleUpdateMaterial}
              onDeleteMaterial={handleDeleteMaterial}
            />
          </div>
        )}

        {activeTab === 'report' && (
          <div className={styles.singlePane}>
            <SummaryReport
              items={activeProject.boqItems}
              materials={materials}
              onImportProject={handleImportProject}
              exportProjectData={exportProjectData}
            />
          </div>
        )}
      </main>

      {/* Footer bản quyền chân trang */}
      <footer className={styles.footer}>
        <p>© 2026 AI-BOQ Estimator. Thiết kế chuyên nghiệp cho kĩ sư xây dựng Việt Nam. Hỗ trợ bóc tách khối lượng và đo vẽ kĩ thuật thời gian thực.</p>
        <div className={styles.footerLinks}>
          <span>Bản vẽ: <strong>{activeProject.drawings.length}</strong></span>
          <span>Số hiệu tính toán: <strong>{activeProject.boqItems.length}</strong></span>
          <span>Thư viện: <strong>{materials.length} vật tư</strong></span>
        </div>
      </footer>
    </div>
  );
}
