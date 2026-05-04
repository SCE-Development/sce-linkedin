import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Alumni } from "../types/alumni";
import { fetchAlumni } from "../services/api";
import AlumniCardGrid from "../components/AlumniCardGrid";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const header = (
  <div className="mb-6 flex items-center justify-between">
    <h1 className="text-2xl font-bold text-gray-900">Alumni Directory</h1>
    <Link
      to="/profile/new"
      className="rounded-md bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
    >
      + Add Profile
    </Link>
  </div>
);

export default function HomePage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlumni()
      .then(setAlumni)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <p className="py-10 text-center text-red-600">Error: {error}</p>;
  if (alumni.length === 0)
    return (
      <>
        {header}
        <EmptyState />
      </>
    );

  return (
    <>
      {header}
      <AlumniCardGrid alumni={alumni} />
    </>
  );
}
