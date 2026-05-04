import type { Alumni } from "../types/alumni";

const BASE = "/api";

export async function fetchAlumni(): Promise<Alumni[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`Failed to fetch alumni: ${res.status}`);
  return res.json();
}

export async function fetchAlumniById(id: string): Promise<Alumni> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch alumni: ${res.status}`);
  return res.json();
}

type AlumniPayload = Omit<Alumni, "_id" | "createdAt" | "updatedAt">;

async function throwApiError(res: Response, context: string): Promise<never> {
  let message = `${context}: ${res.status}`;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
  } catch {}
  throw new Error(message);
}

export async function createAlumni(payload: AlumniPayload): Promise<Alumni> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, "Failed to create alumni");
  return res.json();
}

export async function updateAlumni(id: string, payload: AlumniPayload): Promise<Alumni> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await throwApiError(res, "Failed to update alumni");
  return res.json();
}

export async function deleteAlumni(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) await throwApiError(res, "Failed to delete alumni");
}
