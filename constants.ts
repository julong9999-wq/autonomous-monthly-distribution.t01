// 此檔案現在只保留工具函式，不再包含任何模擬數據。
// 所有的 ETF 資料來源已移至 services/dataService.ts，由 CSV 檔案控制。

export const calculateFee = (price: number, shares: number): number => {
  const amount = price * shares;
  let fee = Math.floor(amount * 0.001425);
  return fee < 20 ? 20 : fee;
};