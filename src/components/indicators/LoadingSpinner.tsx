type Size = 'xs' | 'sm' | 'md' | 'lg';

type Props = {
  size: Size;
}

export default function LoadingSpinner({ size }: Props) {
  const sizeMap: Record<Size, number> = {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
  };

  const px = sizeMap[size];

  return (
    <div className="spinner-wrapper">
      <div 
        className="spinner"
        style={{ 
          width: px,
          height: px,
        }}
      />
    </div>
  );
}
