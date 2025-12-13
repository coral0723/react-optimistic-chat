type Size = "xs" | "sm" | "md" | "lg";

type Props = {
  size?: Size;
};


export default function SendingDots({ size = "md" }: Props) {
  const sizeMap: Record<Size, { wrapperWidth: number; fontSize: number }> = {
    xs: { wrapperWidth: 12, fontSize: 8 },
    sm: { wrapperWidth: 16, fontSize: 10 },
    md: { wrapperWidth: 20, fontSize: 12 },
    lg: { wrapperWidth: 24, fontSize: 14 },
  };

  const { wrapperWidth, fontSize } = sizeMap[size];

  return (
    <span 
      className="roc-sending-dots"
      style={{ width: wrapperWidth }}
      aria-label="sending"
    >
      <span
        className="roc-sending-dot"
        style={{ fontSize, animationDelay: "0ms" }}
      >
        .
      </span>
      <span
        className="roc-sending-dot"
        style={{ fontSize, animationDelay: "200ms" }}
      >
        .
      </span>
      <span
        className="roc-sending-dot"
        style={{ fontSize, animationDelay: "400ms" }}
      >
        .
      </span>
    </span>
  );
}
