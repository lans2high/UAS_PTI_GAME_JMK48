import React from "react";
import "./MiniMap.css"; // Pastikan kamu punya file ini

export default function MiniMap({ playerPosition }) {
  const width = 230;
  const height = 230;
  const canvasWidth = 800;
  const canvasHeight = 600;
  const scaleX = width / canvasWidth;
  const scaleY = height / canvasHeight;

  const shopPoints = [
    { x: 70, y: 75, color: "yellow", label: "Food Stall" },
    { x: 400, y: 75, color: "blue", label: "Clinic" },
    { x: 730, y: 75, color: "green", label: "Weapon Shop" },
    { x: 70, y: 520, color: "purple", label: "Rest Area" },
  ];

  return (
    <div className="minimap-container">
      {/* Radius deteksi */}
      <div
        className="minimap-radius"
        style={{
          top: (playerPosition?.y || 0) * scaleY - 10,
          left: (playerPosition?.x || 0) * scaleX - 10,
        }}
      />
      {/* Player */}
      <div
        className="minimap-point minimap-player"
        style={{
          top: (playerPosition?.y || 0) * scaleY,
          left: (playerPosition?.x || 0) * scaleX,
        }}
      />
      {/* Markers */}
      {shopPoints.map((point, index) => (
        <div
          key={index}
          title={point.label}
          className="minimap-point"
          style={{
            top: point.y * scaleY,
            left: point.x * scaleX,
            backgroundColor: point.color,
          }}
        />
      ))}
    </div>
  );
}
