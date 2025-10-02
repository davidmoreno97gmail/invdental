import React from "react";
import QRCode from "qrcode.react";

export default function QRGenerator({ value }) {
  if (!value) return null;
  const isUrl = typeof value === 'string' && (value.startsWith('http') || value.startsWith('/api'));
  return (
    <div className="flex flex-col items-center">
      {isUrl ? (
        <img src={value} alt="QR" className="w-32 h-32" />
      ) : (
        <QRCode value={value} size={128} />
      )}
      <p className="text-xs mt-2 break-all">{value}</p>
    </div>
  );
}
