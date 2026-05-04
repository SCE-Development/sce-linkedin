import { z } from "zod";
import { Request, Response } from "express";

export const createAlumniSchema = z.object({
  bio: z.string().max(2600).optional(),
  headline: z.string().max(220).optional(),
  profilePhotoUrl: z.url("Must be a valid URL").optional(),
  linkedInUrl: z.url("Must be a valid URL").regex(/linkedin\.com\/in/, "Must be a valid LinkedIn URL").optional(),
  startYear: z.number().refine((y) => y.toString().length === 4, "Must be a 4-digit year"),
  graduationYear: z.number().refine((y) => y.toString().length === 4, "Must be a 4-digit year"),
  major: z.string().max(50).optional(),
  experiences: z.array(
    z.object({
      company: z.string().min(1).max(100),
      title: z.string().min(1).max(100),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      isCurrent: z.boolean(),
      description: z.string().max(2000)
    })
  ).optional()
});

export type CreateAlumniInput = z.infer<typeof createAlumniSchema>;

export const updateAlumniSchema = z.object({
  bio: z.string().max(2600).optional(),
  headline: z.string().max(220).optional(),
  profilePhotoUrl: z.url("Must be a valid URL").optional(),
  linkedInUrl: z.url("Must be a valid URL").regex(/linkedin\.com\/in/, "Must be a valid LinkedIn URL").optional(),
  startYear: z.number().refine((y) => y.toString().length === 4, "Must be a 4-digit year").optional(),
  graduationYear: z.number().refine((y) => y.toString().length === 4, "Must be a 4-digit year").optional(),
  major: z.string().max(50).optional(),
  experiences: z.array(
    z.object({
      company: z.string().min(1).max(100).optional(),
      title: z.string().min(1).max(100).optional(),
      startDate: z.date().optional().optional(),
      endDate: z.date().optional().optional(),
      isCurrent: z.boolean().optional(),
      description: z.string().max(2000).optional()
    })
  ).optional()
})
.refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
});

export type UpdateAlumniInput = z.infer<typeof updateAlumniSchema>;

export const validate = (schema: z.ZodObject<any>) => (req: Request, res: Response, next: Function) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};
