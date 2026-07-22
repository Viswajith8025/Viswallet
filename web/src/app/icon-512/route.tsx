import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#5f4a8b",
          borderRadius: 108,
          color: "#fefacd",
          fontSize: 256,
          fontWeight: 700,
        }}
      >
        V
      </div>
    ),
    { width: 512, height: 512 },
  );
}
