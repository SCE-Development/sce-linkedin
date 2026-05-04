export interface Experience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}

export interface Alumni {
  _id: string;
  userId: string;
  name: string;
  bio: string;
  headline: string;
  linkedInUrl: string;
  startYear?: number;
  graduationYear?: number;
  major: string;
  experiences: Experience[];
  createdAt: string;
  updatedAt: string;
}
