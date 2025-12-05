import { useNavigate } from "react-router-dom";
import './styles/linkButton.css';

type Props = {
  label: string;
  to: string;
};

export default function LinkButton({ label, to }: Props) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className="link-btn"
    >
      {label}
    </button>
  );
}
