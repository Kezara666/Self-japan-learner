import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { QuizHome } from "./pages/QuizHome";
import { QuizPlay } from "./pages/QuizPlay";
import { WritingBoard } from "./pages/WritingBoard";
import { WritingHome } from "./pages/WritingHome";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/quiz" replace />} />
        <Route path="quiz" element={<QuizHome />} />
        <Route path="quiz/play" element={<QuizPlay />} />
        <Route path="writing" element={<WritingHome />} />
        <Route path="writing/board" element={<WritingBoard />} />
      </Route>
    </Routes>
  );
}
