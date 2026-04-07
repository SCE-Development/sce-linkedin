import { Link, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-200">
      <nav className="border-b border-slate-300 bg-slate-700">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link to="/" className="text-xl font-bold text-white">
            SCE Alumni Directory
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
