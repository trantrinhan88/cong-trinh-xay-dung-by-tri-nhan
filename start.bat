@echo off
title AI-BOQ Estimator - Khoi dong nhanh
color 0B
echo ==============================================================
echo   🏛️  KHOI DONG UNG DUNG BOC TACH KHOI LUONG AI-BOQ ESTIMATOR
echo ==============================================================
echo.
echo  [1/2] Dang mo trinh duyet truy cap phan mem tai dia chi:
echo        http://localhost:3000
echo.
start http://localhost:3000
timeout /t 1 >nul
echo  [2/2] Dang khoi dong May chu Next.js (npm run dev)...
echo        (Vui long giu nguyen cua so nay khi dang dung ung dung)
echo.
echo ==============================================================
npm run dev
