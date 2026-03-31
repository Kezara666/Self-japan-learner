import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BlackboardPractice, type WriteScript } from "../components/BlackboardPractice";

const scripts: WriteScript[] = ["hiragana", "katakana", "kanji"];

function parseScript(raw: string | null): WriteScript | null {
  if (!raw) return null;
  return scripts.includes(raw as WriteScript) ? (raw as WriteScript) : null;
}

export function WritingBoard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const script = parseScript(params.get("script"));

  useEffect(() => {
    if (!script) navigate("/writing", { replace: true });
  }, [script, navigate]);

  if (!script) return null;

  return <BlackboardPractice script={script} onBack={() => navigate("/writing")} />;
}
