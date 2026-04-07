import { Link } from "react-router-dom";
import type { Alumni } from "../types/alumni";

interface Props {
  alumni: Alumni;
}

export default function AlumniCard({ alumni }: Props) {
  return (
    <Link
      to={`/alumni/${alumni._id}`}
      className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        {alumni.profilePhotoUrl ? (
          <img
            src={alumni.profilePhotoUrl}
            alt={alumni.headline}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
            {alumni.headline?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        <div className="min-w-0 text-left">
          <h3 className="truncate text-lg font-semibold text-gray-900">
            {alumni.headline || "Unnamed Alumni"}
          </h3>
          {alumni.major && (
            <p className="text-sm text-gray-600">{alumni.major}</p>
          )}
          {alumni.graduationYear && (
            <p className="text-sm text-gray-500">
              Class of {alumni.graduationYear}
            </p>
          )}
        </div>
      </div>

      {alumni.linkedInUrl && (
        <div className="mt-4">
          <span
            onClick={(e) => {
              e.preventDefault();
              window.open(alumni.linkedInUrl, "_blank", "noopener");
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </span>
        </div>
      )}
    </Link>
  );
}
