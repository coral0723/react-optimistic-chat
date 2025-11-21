type Size = 'xs' | 'sm' | 'md' | 'lg';

type Props = {
  size: Size;
}

export default function LoadingSpinner({size}: Props) {
  const sizeClasses: Record<Size, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}
        style={{ borderRightColor: 'transparent' }}
      />
    </div>
  );
};
