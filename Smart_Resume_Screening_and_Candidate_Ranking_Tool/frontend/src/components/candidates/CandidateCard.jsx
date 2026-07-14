import { Link } from "react-router-dom";
import { LuMail, LuPhone, LuGraduationCap } from "react-icons/lu";
import ScoreRing from "../ui/ScoreRing";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";

export default function CandidateCard({ candidate }) {
  const atsScore = candidate.ats_report?.overall_score;
  const skills = candidate.extracted_skills || [];
  const displayName = candidate.full_name || candidate.filename;

  return (
    <Link
      to={`/candidates/${candidate.id}`}
      className="block bg-surface border border-border rounded-xl p-5 hover-lift hover:border-accent/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar name={displayName} size="md" />
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-sm text-ink truncate">
              {displayName}
            </h3>
            <div className="mt-1.5 space-y-1">
              {candidate.email && (
                <p className="text-xs text-ink-soft flex items-center gap-1.5 truncate">
                  <LuMail className="h-3 w-3 shrink-0" /> {candidate.email}
                </p>
              )}
              {candidate.phone && (
                <p className="text-xs text-ink-soft flex items-center gap-1.5">
                  <LuPhone className="h-3 w-3 shrink-0" /> {candidate.phone}
                </p>
              )}
            </div>
          </div>
        </div>
        {atsScore !== undefined && <ScoreRing score={atsScore} size="sm" />}
      </div>

      {candidate.education?.length > 0 && (
        <p className="text-xs text-ink-soft flex items-center gap-1.5 mt-3">
          <LuGraduationCap className="h-3.5 w-3.5" /> {candidate.education.join(", ")}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {skills.slice(0, 5).map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
        {skills.length > 5 && <Badge tone="outline">+{skills.length - 5} more</Badge>}
        {skills.length === 0 && <span className="text-xs text-ink-soft">No skills detected</span>}
      </div>
    </Link>
  );
}
