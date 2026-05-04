import { NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof MongooseError.CastError) {
        res.status(400).json({ error: `Invalid ID: ${err.value}` });
    }
    else {
        res.status(500).json({ error: 'Internal server error' });
    }
}
