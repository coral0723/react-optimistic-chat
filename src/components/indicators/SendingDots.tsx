type Size = "xs" | "sm" | "md" | "lg";

type Props = {
  size?: Size;
};

export default function SendingDots({ size = "md" }: Props) {
  const sizeMap = {
    xs: {
      wrapper: "w-3",
      dot: "text-[8px]",
    },
    sm: {
      wrapper: "w-4",
      dot: "text-[10px]",
    },
    md: {
      wrapper: "w-5",
      dot: "text-[12px]",
    },
    lg: {
      wrapper: "w-6",
      dot: "text-[14px]",
    },
  } as const;

  const { wrapper, dot } = sizeMap[size];

  return (
    <>
      <style>
        {`
          @keyframes chatinput-loading-bounce {
            0%, 100% { opacity: 0.2; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-2px); }
          }
        `}
      </style>

      <span className={`inline-flex justify-between ${wrapper}`}>
        <span
          className={`${dot} font-extrabold animate-[chatinput-loading-bounce_1.4s_ease-in-out_infinite]`}
        >
          .
        </span>
        <span
          className={`${dot} font-extrabold animate-[chatinput-loading-bounce_1.4s_ease-in-out_0.2s_infinite]`}
        >
          .
        </span>
        <span
          className={`${dot} font-extrabold animate-[chatinput-loading-bounce_1.4s_ease-in-out_0.4s_infinite]`}
        >
          .
        </span>
      </span>
    </>
  );
}
