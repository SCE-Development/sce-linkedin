import { Router, Request, Response } from 'express';
import Alumni from '../models/Alumni';
import { validate, createAlumniSchema, updateAlumniSchema, CreateAlumniInput, UpdateAlumniInput } from '../schema/AlumniSchema';

const router = Router();

// List all alumni profiles
router.get('/', async (req: Request, res: Response) => {
  try {
    const alumni = await Alumni.find();
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Get a single alumni profile by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const alumni = await Alumni.findById(req.params.id);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Create a new alumni profile
router.post('/', validate(createAlumniSchema), async (req: Request, res: Response) => {
  try {
    const alumni = await new Alumni(req.body as CreateAlumniInput).save();
    res.status(201).json(alumni);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Update an existing alumni profile
router.put('/:id', validate(updateAlumniSchema), async (req: Request, res: Response) => {
  try {
    const alumni = await Alumni.findByIdAndUpdate(req.params.id, req.body as UpdateAlumniInput, {
      new: true,
      runValidators: true,
    });
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Delete an alumni profile
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const alumni = await Alumni.findByIdAndDelete(req.params.id);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
