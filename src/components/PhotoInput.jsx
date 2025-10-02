import React, { useRef } from "react";

export default function PhotoInput({ value, onChange }) {
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleCapture() {
    fileRef.current.click();
  }

  return (
    <div className="flex flex-col gap-2">
      {value && <img src={value} alt="foto" className="h-20 w-20 object-cover rounded" />}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileRef}
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <button type="button" className="btn btn-info" onClick={handleCapture}>
        {value ? "Cambiar foto" : "Tomar foto"}
      </button>
    </div>
  );
}
