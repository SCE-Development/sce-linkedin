import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Alumni } from "../types/alumni";
import { fetchAlumniById } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchAlumniById(id)
      .then(setAlumni)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <p className="py-10 text-center text-red-600">Error: {error}</p>;
  if (!alumni)
    return <p className="py-10 text-center text-gray-500">Alumni not found.</p>;

  return (
    <div>
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Back to directory
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          {alumni.profilePhotoUrl ? (
            <img
              src={alumni.profilePhotoUrl}
              alt={alumni.headline}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
              {alumni.headline?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {alumni.headline || "Unnamed Alumni"}
            </h1>
            {alumni.major && (
              <p className="mt-1 text-gray-600">{alumni.major}</p>
            )}
            {alumni.graduationYear && (
              <p className="text-sm text-gray-500">
                Class of {alumni.graduationYear}
              </p>
            )}
            {alumni.linkedInUrl && (
              <a
                href={alumni.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                View LinkedIn Profile
              </a>
            )}
          </div>
        </div>

        {alumni.bio && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">About</h2>
            <p className="mt-2 whitespace-pre-line text-gray-700">
              {alumni.bio}
            </p>
          </div>
        )}

        {alumni.experiences.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Experience</h2>
            <div className="mt-4 space-y-6">
              {alumni.experiences.map((exp, i) => (
                <div
                  key={i}
                  className="border-l-2 border-blue-200 pl-4"
                >
                  <h3 className="font-medium text-gray-900">{exp.title}</h3>
                  <p className="text-sm text-gray-600">{exp.company}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(exp.startDate)} &ndash;{" "}
                    {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                  </p>
                  {exp.description && (
                    <p className="mt-2 text-sm text-gray-700">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
