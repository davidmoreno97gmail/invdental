import React, { useRef, useEffect } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

export default function QRScanner({ onResult }) {
  const videoRef = useRef(null);
  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();
    let stop = false;
    codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
      if (result && !stop) {
        stop = true;
        onResult(result.getText());
        codeReader.reset();
      }
    });
    return () => {
      stop = true;
      codeReader.reset();
    };
  }, [onResult]);
  return (
    <div>
      <video ref={videoRef} className="w-full max-w-xs border rounded" />
    </div>
  );
}
