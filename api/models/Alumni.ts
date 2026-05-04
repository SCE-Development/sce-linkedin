import mongoose, { Document, Schema } from "mongoose";

export interface IExperience {
  company: string;
  title: string;
  startDate?: Date;
  endDate?: Date;
  isCurrent: boolean;
  description: string;
}

export interface IAlumni extends Document {
  userId: string;
  name: string;
  bio: string;
  headline: string;
  linkedInUrl: string;
  startYear?: number;
  graduationYear?: number;
  major: string;
  experiences: IExperience[];
}

const ExperienceSchema = new Schema<IExperience>({
  company: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  isCurrent: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    default: "",
  },
});

const AlumniSchema = new Schema<IAlumni>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    headline: {
      type: String,
      default: "",
    },
    linkedInUrl: {
      type: String,
      default: "",
    },
    startYear: {
      type: Number,
    },
    graduationYear: {
      type: Number,
    },
    major: {
      type: String,
      default: "",
    },
    experiences: {
      type: [ExperienceSchema],
      default: [],
    },
  },
  {
    collection: "AlumniProfile",
    timestamps: true,
  },
);

export default mongoose.model<IAlumni>("Alumni", AlumniSchema);
