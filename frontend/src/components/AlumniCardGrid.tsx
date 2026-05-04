import type { Alumni } from "../types/alumni";
import AlumniCard from "./AlumniCard";

interface Props {
  alumni: Alumni[];
}

export default function AlumniCardGrid({ alumni }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {alumni.map((a) => (
        <AlumniCard key={a._id} alumni={a} />
      ))}
    </div>
  );
}
