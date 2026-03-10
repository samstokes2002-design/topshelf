import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut } from "lucide-react";

const CROP_SIZE = 280;

export default function ImageCropper({ file, onCrop, onCancel }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageSrc, setImageSrc] = useState(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
  };

  // Mouse
  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  // Touch
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
  };
  const handleTouchMove = (e) => {
    if (!dragging || e.touches.length !== 1) return;
    const t = e.touches[0];
    setPosition({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };
  const handleTouchEnd = () => setDragging(false);

  const handleCrop = () => {
    const canvas = document.createElement("canvas");
    const outputSize = 400;
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();

    const img = imageRef.current;
    const baseScale = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    const totalScale = baseScale * scale;
    const renderedW = img.naturalWidth * totalScale;
    const renderedH = img.naturalHeight * totalScale;
    const imgLeft = CROP_SIZE / 2 + position.x - renderedW / 2;
    const imgTop = CROP_SIZE / 2 + position.y - renderedH / 2;

    const srcX = (0 - imgLeft) / totalScale;
    const srcY = (0 - imgTop) / totalScale;
    const srcW = CROP_SIZE / totalScale;
    const srcH = CROP_SIZE / totalScale;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputSize, outputSize);

    canvas.toBlob((blob) => {
      onCrop(new File([blob], "profile.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
  };

  if (!imageSrc) return null;

  const baseScale = imageSize.width && imageSize.height
    ? Math.max(CROP_SIZE / imageSize.width, CROP_SIZE / imageSize.height)
    : 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-white font-semibold text-base">Move & Zoom</h2>
          <div className="w-6" />
        </div>

        {/* Circular crop preview */}
        <div className="flex justify-center mb-8">
          <div
            className="relative overflow-hidden rounded-full border-2 border-white/40 shadow-2xl"
            style={{ width: CROP_SIZE, height: CROP_SIZE, cursor: dragging ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              onLoad={handleImageLoad}
              draggable={false}
              alt=""
              style={{
                position: "absolute",
                width: imageSize.width * baseScale * scale,
                height: imageSize.height * baseScale * scale,
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 mb-8">
          <ZoomOut className="w-5 h-5 text-white/50 flex-shrink-0" />
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-sky-400 h-1"
          />
          <ZoomIn className="w-5 h-5 text-white/50 flex-shrink-0" />
        </div>

        <p className="text-slate-500 text-xs text-center mb-6">Drag to reposition · Slide to zoom</p>

        <Button
          onClick={handleCrop}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl h-12 text-base"
        >
          Use Photo
        </Button>
      </div>
    </div>
  );
}