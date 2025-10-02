export function exportToCSV(data, filename = "inventario.csv") {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(",")].concat(
    data.map(row => keys.map(k => '"' + (row[k] ?? "") + '"').join(","))
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
