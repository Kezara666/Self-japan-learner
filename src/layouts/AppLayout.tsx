import { NavLink, Outlet } from "react-router-dom";

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
    isActive
      ? "bg-[#c45c5c]/20 text-[#e8eaef] ring-1 ring-[#c45c5c]/40"
      : "text-slate-400 hover:bg-white/5 hover:text-[#e8eaef]",
  ].join(" ");

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row md:h-screen md:overflow-hidden">
      <aside
        className="flex shrink-0 flex-row gap-1 border-b border-[#2d3548] bg-[#121018] p-3 md:w-56 md:flex-col md:border-b-0 md:border-r md:pt-6"
        aria-label="Main navigation"
      >
        <div className="mb-0 hidden px-2 md:mb-6 md:block">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Japanese</p>
          <p className="text-lg font-bold text-[#e8eaef]">Practice</p>
        </div>
        <nav className="flex flex-1 flex-row gap-1 md:flex-col md:gap-1">
          <NavLink to="/quiz" className={navClass}>
            <span className="text-lg md:text-base" aria-hidden>
              問
            </span>
            <span>Quiz</span>
          </NavLink>
          <NavLink to="/writing" className={navClass}>
            <span className="text-lg md:text-base" aria-hidden>
              写
            </span>
            <span>Writing</span>
          </NavLink>
        </nav>
      </aside>
      <main className="min-h-0 flex-1 overflow-y-auto bg-[#0f1219]">
        <Outlet />
      </main>
    </div>
  );
}
