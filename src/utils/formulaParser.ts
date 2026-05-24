/**
 * Bộ phân tích diễn giải toán học chuyên dụng cho ngành xây dựng.
 * Giúp trích xuất và tính toán kết quả số học từ các chuỗi diễn giải khối lượng của kỹ sư.
 * Ví dụ: "Móng M1 (Bê tông): 4 * 1.2 * 1.2 * 0.5" => 2.88
 */
export function parseFormula(input: string): { quantity: number; cleanFormula: string; error?: string } {
  if (!input || input.trim() === "") {
    return { quantity: 0, cleanFormula: "" };
  }

  // 1. Tách chuỗi theo dấu hai chấm ":" cuối cùng nếu có để lấy phần toán học
  let mathPart = input;
  const colonIndex = input.lastIndexOf(':');
  if (colonIndex !== -1) {
    mathPart = input.substring(colonIndex + 1);
  }

  // 2. Làm sạch và chuẩn hóa chuỗi toán học
  // Thay thế dấu nhân 'x', 'X' bằng '*'
  let cleanExpr = mathPart.replace(/[xX]/g, '*');
  
  // Thay thế dấu phẩy thập phân ',' kiểu Việt Nam thành '.' khi nằm giữa các con số (ví dụ: "1,2" => "1.2")
  cleanExpr = cleanExpr.replace(/(\d),(\d)/g, '$1.$2');

  // Loại bỏ các chú thích chữ nằm trong ngoặc tròn hoặc ngoặc vuông nằm trong phần công thức
  // ví dụ: "2 * 3.5 * 0.2 (trừ cửa)" => "2 * 3.5 * 0.2 "
  cleanExpr = cleanExpr.replace(/\([a-zA-Zà-ỹÀ-Ỹ\s%+\-*/=]+\)/g, '');
  cleanExpr = cleanExpr.replace(/\[[a-zA-Zà-ỹÀ-Ỹ\s%+\-*/=]+\]/g, '');

  // Lọc chỉ giữ lại các ký tự toán học hợp lệ
  cleanExpr = cleanExpr.replace(/[^0-9+\-*/().\s]/g, '');

  cleanExpr = cleanExpr.trim();

  if (cleanExpr === "") {
    return { 
      quantity: 0, 
      cleanFormula: "", 
      error: "Không tìm thấy công thức toán học hợp lệ sau dấu hai chấm" 
    };
  }

  try {
    // Kiểm tra tính an toàn: chỉ chứa chữ số, dấu cộng, trừ, nhân, chia, ngoặc đơn, dấu chấm và dấu cách
    const safeRegex = /^[0-9+\-*/().\s]+$/;
    if (!safeRegex.test(cleanExpr)) {
      throw new Error("Công thức chứa ký tự không hợp lệ");
    }

    // Đánh giá công thức bằng Function an toàn (không sử dụng eval)
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${cleanExpr})`)();
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error("Kết quả không phải số hợp lệ");
    }

    // Làm tròn 3 chữ số thập phân cho khối lượng xây dựng tiêu chuẩn
    const roundedResult = Math.round(result * 1000) / 1000;

    return {
      quantity: roundedResult,
      cleanFormula: cleanExpr
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Lỗi cú pháp toán học";
    return {
      quantity: 0,
      cleanFormula: cleanExpr,
      error: errorMessage
    };
  }
}
