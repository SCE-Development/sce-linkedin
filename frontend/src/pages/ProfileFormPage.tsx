import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchAlumniById, createAlumni, updateAlumni } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

interface ExperienceFormState {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

interface FormState {
  userId: string;
  name: string;
  headline: string;
  bio: string;
  major: string;
  linkedInUrl: string;
  startYear: string;
  graduationYear: string;
  experiences: ExperienceFormState[];
}

const EMPTY_EXP: ExperienceFormState = {
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
};

const EMPTY_FORM: FormState = {
  userId: "",
  name: "",
  headline: "",
  bio: "",
  major: "",
  linkedInUrl: "",
  startYear: "",
  graduationYear: "",
  experiences: [],
};

const INPUT_BASE =
  "w-full rounded-md border px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const INPUT_NORMAL = `${INPUT_BASE} border-gray-300 bg-white`;
const INPUT_ERROR = `${INPUT_BASE} border-red-400 bg-red-50`;

function fieldClass(error?: string) {
  return error ? INPUT_ERROR : INPUT_NORMAL;
}

function buildPayload(form: FormState) {
  return {
    userId: form.userId as unknown as import("../types/alumni").Alumni["userId"],
    name: form.name.trim(),
    headline: form.headline.trim(),
    bio: form.bio.trim(),
    major: form.major.trim(),
    linkedInUrl: form.linkedInUrl.trim(),
    startYear: form.startYear ? parseInt(form.startYear, 10) : undefined,
    graduationYear: form.graduationYear ? parseInt(form.graduationYear, 10) : undefined,
    experiences: form.experiences.map((exp) => ({
      company: exp.company.trim(),
      title: exp.title.trim(),
      startDate: exp.startDate || undefined,
      endDate: exp.isCurrent ? undefined : exp.endDate || undefined,
      isCurrent: exp.isCurrent,
      description: exp.description.trim(),
    })),
  };
}

export default function ProfileFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(isEditMode);

  useEffect(() => {
    if (!id) return;
    fetchAlumniById(id)
      .then((alumni) => {
        setForm({
          userId: String(alumni.userId),
          name: alumni.name ?? "",
          headline: alumni.headline ?? "",
          bio: alumni.bio ?? "",
          major: alumni.major ?? "",
          linkedInUrl: alumni.linkedInUrl ?? "",
          startYear: alumni.startYear != null ? String(alumni.startYear) : "",
          graduationYear: alumni.graduationYear != null ? String(alumni.graduationYear) : "",
          experiences: alumni.experiences.map((exp) => ({
            company: exp.company,
            title: exp.title,
            startDate: exp.startDate ? exp.startDate.slice(0, 7) : "",
            endDate: exp.endDate ? exp.endDate.slice(0, 7) : "",
            isCurrent: exp.isCurrent,
            description: exp.description ?? "",
          })),
        });
      })
      .catch((e: Error) => setSubmitError(e.message))
      .finally(() => setLoadingProfile(false));
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function handleExpChange(index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) =>
        i === index ? { ...exp, [name]: type === "checkbox" ? checked : value } : exp
      ),
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`exp_${index}_${name}`];
      return next;
    });
  }

  function addExperience() {
    setForm((prev) => ({ ...prev, experiences: [...prev.experiences, { ...EMPTY_EXP }] }));
  }

  function removeExperience(index: number) {
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
    setErrors((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!k.startsWith(`exp_${index}_`)) next[k] = v;
      }
      return next;
    });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!form.userId.trim()) {
      newErrors.userId = "User ID is required";
    }

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.major.trim()) newErrors.major = "Major is required";

    if (form.startYear) {
      const y = parseInt(form.startYear, 10);
      if (isNaN(y) || y < 1900 || y > 2100) newErrors.startYear = "Must be a year between 1900 and 2100";
    }
    if (form.graduationYear) {
      const y = parseInt(form.graduationYear, 10);
      if (isNaN(y) || y < 1900 || y > 2100) newErrors.graduationYear = "Must be a year between 1900 and 2100";
    }
    if (form.linkedInUrl && !form.linkedInUrl.startsWith("https://")) {
      newErrors.linkedInUrl = "Must start with https://";
    }

    form.experiences.forEach((exp, i) => {
      if (!exp.company.trim()) newErrors[`exp_${i}_company`] = "Company is required";
      if (!exp.title.trim()) newErrors[`exp_${i}_title`] = "Title is required";
      if (!exp.startDate) newErrors[`exp_${i}_startDate`] = "Start date is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildPayload(form);
      if (isEditMode) {
        const updated = await updateAlumni(id!, payload as Parameters<typeof updateAlumni>[1]);
        navigate(`/alumni/${updated._id}`);
      } else {
        const created = await createAlumni(payload as Parameters<typeof createAlumni>[0]);
        navigate(`/alumni/${created._id}`);
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingProfile) return <LoadingSpinner />;

  return (
    <div>
      <Link
        to={isEditMode ? `/alumni/${id}` : "/"}
        className="mb-6 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; {isEditMode ? "Back to profile" : "Back to directory"}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isEditMode ? "Edit Profile" : "Create Profile"}
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="rounded-lg border border-gray-200 bg-white p-8">

          {/* User ID */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              User ID (MongoDB ObjectId) <span className="text-red-500">*</span>
            </label>
            <input
              name="userId"
              value={form.userId}
              onChange={handleChange}
              placeholder="e.g. 1"
              className={fieldClass(errors.userId)}
            />
            {errors.userId && <p className="mt-1 text-xs text-red-600">{errors.userId}</p>}
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
              className={fieldClass(errors.name)}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Headline */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Headline
            </label>
            <input
              name="headline"
              value={form.headline}
              onChange={handleChange}
              placeholder="e.g. Software Engineer at Acme Corp"
              className={fieldClass(errors.headline)}
            />
            {errors.headline && <p className="mt-1 text-xs text-red-600">{errors.headline}</p>}
          </div>

          {/* Major */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Major <span className="text-red-500">*</span>
            </label>
            <input
              name="major"
              value={form.major}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              className={fieldClass(errors.major)}
            />
            {errors.major && <p className="mt-1 text-xs text-red-600">{errors.major}</p>}
          </div>

          {/* Start Year + Graduation Year */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Year</label>
              <input
                type="number"
                name="startYear"
                value={form.startYear}
                onChange={handleChange}
                min="1900"
                max="2100"
                placeholder="e.g. 2018"
                className={fieldClass(errors.startYear)}
              />
              {errors.startYear && <p className="mt-1 text-xs text-red-600">{errors.startYear}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Graduation Year</label>
              <input
                type="number"
                name="graduationYear"
                value={form.graduationYear}
                onChange={handleChange}
                min="1900"
                max="2100"
                placeholder="e.g. 2022"
                className={fieldClass(errors.graduationYear)}
              />
              {errors.graduationYear && <p className="mt-1 text-xs text-red-600">{errors.graduationYear}</p>}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us about yourself..."
              className={`${fieldClass(errors.bio)} resize-y`}
            />
          </div>


          {/* LinkedIn URL */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">LinkedIn URL</label>
            <input
              name="linkedInUrl"
              value={form.linkedInUrl}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/yourname"
              className={fieldClass(errors.linkedInUrl)}
            />
            {errors.linkedInUrl && <p className="mt-1 text-xs text-red-600">{errors.linkedInUrl}</p>}
          </div>

          {/* Experiences */}
          <div className="mt-8 flex items-center justify-between border-b border-gray-200 pb-2">
            <h2 className="text-lg font-semibold text-gray-900">Experience</h2>
            <button
              type="button"
              onClick={addExperience}
              className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Add Experience
            </button>
          </div>

          {form.experiences.map((exp, i) => (
            <div key={i} className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Experience {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeExperience(i)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="company"
                    value={exp.company}
                    onChange={(e) => handleExpChange(i, e)}
                    placeholder="Acme Corp"
                    className={fieldClass(errors[`exp_${i}_company`])}
                  />
                  {errors[`exp_${i}_company`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`exp_${i}_company`]}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    value={exp.title}
                    onChange={(e) => handleExpChange(i, e)}
                    placeholder="Software Engineer"
                    className={fieldClass(errors[`exp_${i}_title`])}
                  />
                  {errors[`exp_${i}_title`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`exp_${i}_title`]}</p>
                  )}
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="month"
                    name="startDate"
                    value={exp.startDate}
                    onChange={(e) => handleExpChange(i, e)}
                    className={fieldClass(errors[`exp_${i}_startDate`])}
                  />
                  {errors[`exp_${i}_startDate`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`exp_${i}_startDate`]}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">End Date</label>
                  <input
                    type="month"
                    name="endDate"
                    value={exp.endDate}
                    onChange={(e) => handleExpChange(i, e)}
                    disabled={exp.isCurrent}
                    className={`${fieldClass(errors[`exp_${i}_endDate`])} ${
                      exp.isCurrent ? "cursor-not-allowed bg-gray-100 opacity-50" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    name="isCurrent"
                    checked={exp.isCurrent}
                    onChange={(e) => handleExpChange(i, e)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  Currently working here
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
                <textarea
                  name="description"
                  value={exp.description}
                  onChange={(e) => handleExpChange(i, e)}
                  rows={2}
                  placeholder="Describe your role..."
                  className={`${fieldClass(errors[`exp_${i}_description`])} resize-y`}
                />
              </div>
            </div>
          ))}

          {/* Submit */}
          {submitError && (
            <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <div className="mt-8 flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-800 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Profile"}
            </button>
            <Link
              to={isEditMode ? `/alumni/${id}` : "/"}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
