import { useEffect, useState } from "react";
import type { Alumni } from "../types/alumni";
import { fetchAlumni } from "../services/api";
import AlumniCardGrid from "../components/AlumniCardGrid";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

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
  if (alumni.length === 0) return <EmptyState />;

  return <AlumniCardGrid alumni={alumni} />;
}
