import { ImageResponse } from "next/og";

export const alt = "Health Care Pvt. Ltd. — compassionate specialist hospital care";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ background: "#064e4a", color: "white", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 28, letterSpacing: 4, color: "#97f5e8" }}>HEALTH CARE PVT. LTD.</div>
      <div style={{ display: "flex", marginTop: 28, maxWidth: 900, fontSize: 78, fontWeight: 700, lineHeight: 1.05 }}>Care that feels human.</div>
      <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#d7efeb" }}>Specialists, appointments and 24/7 emergency care in Kolkata.</div>
    </div>,
    size,
  );
}
