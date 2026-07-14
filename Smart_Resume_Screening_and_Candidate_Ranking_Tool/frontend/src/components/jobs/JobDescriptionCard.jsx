import { Link } from "react-router-dom";
import { LuArrowRight } from "react-icons/lu";
import Badge from "../ui/Badge";

export default function JobDescriptionCard({ jd }) {
  return (
    <Link
      to={`/jobs/${jd.id}`}
      className="block bg-surface border border-border rounded-xl p-5 hover-lift hover:border-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display font-semibold text-sm text-ink">{jd.title}</h3>
        <LuArrowRight className="h-4 w-4 text-ink-soft shrink-0 mt-0.5" />
      </div>
      <p className="text-xs text-ink-soft mt-2 line-clamp-2 leading-relaxed">{jd.raw_text}</p>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {(jd.required_skills || []).slice(0, 4).map((skill) => (
          <Badge key={skill} tone="accent">{skill}</Badge>
        ))}
        {(jd.required_skills || []).length > 4 && (
          <Badge tone="outline">+{jd.required_skills.length - 4}</Badge>
        )}
      </div>
    </Link>
  );
}
