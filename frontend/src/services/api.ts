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
