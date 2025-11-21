import { useNavigate } from "react-router-dom";

type Props = {
  label: string;
  to: string;
};

export default function LinkButton({ label, to }: Props) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full text-left"
    >
      {label}
    </button>
  );
}
