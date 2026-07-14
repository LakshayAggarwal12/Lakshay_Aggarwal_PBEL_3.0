import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuMail, LuPhone, LuGraduationCap, LuBriefcase } from "react-icons/lu";
import Topbar from "../components/layout/Topbar";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ScoreRing from "../components/ui/ScoreRing";
import Avatar from "../components/ui/Avatar";
import AtsChecklist from "../components/candidates/AtsChecklist";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonCard } from "../components/ui/Skeleton";
import { useAppData } from "../context/AppDataContext";
import { getCandidate, getAtsReport } from "../services/candidateService";

export default function CandidateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCandidateById, loading: listLoading } = useAppData();
  const fromList = getCandidateById(Number(id));

  const [fetched, setFetched] = useState(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Not in the already-loaded list (e.g. a direct link opened on another
  // device/browser) — fetch it straight from the backend by id instead of
  // giving up. This is what actually closes the cross-device gap: the
  // candidate lives in the real database regardless of which browser
  // uploaded it.
  useEffect(() => {
    if (fromList || listLoading) return;
    let cancelled = false;
    setFetching(true);
    Promise.all([getCandidate(Number(id)), getAtsReport(Number(id)).catch(() => null)])
      .then(([candidate, atsReport]) => {
        if (!cancelled) setFetched({ ...candidate, ats_report: atsReport });
      })
      .catch(() => {
        if (!cancelled) setFetchFailed(true);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fromList, listLoading, id]);

  const candidate = fromList || fetched;

  if (listLoading || fetching) {
    return (
      <>
        <Topbar title="Loading..." />
        <div className="p-6 max-w-5xl">
          <SkeletonCard />
        </div>
      </>
    );
  }

  if (!candidate || fetchFailed) {
    return (
      <>
        <Topbar title="Candidate not found" />
        <div className="p-6 max-w-4xl">
          <Card>
            <EmptyState
              title="Candidate not found"
              description="This candidate doesn't exist, or may have been removed from the backend."
              action={<Button onClick={() => navigate("/candidates")} size="sm">Back to candidates</Button>}
            />
          </Card>
        </div>
      </>
    );
  }

  const atsReport = candidate.ats_report;
  const displayName = candidate.full_name || candidate.filename;

  return (
    <>
      <Topbar
        title={
          <span className="flex items-center gap-2.5">
            <Avatar name={displayName} size="sm" />
            {displayName}
          </span>
        }
        subtitle={candidate.filename}
        actions={
          <Button variant="ghost" size="sm" icon={LuArrowLeft} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="p-6 max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="font-display font-semibold text-sm mb-4">ATS parseability</h3>
            {atsReport ? (
              <>
                <div className="flex items-center gap-6 mb-2">
                  <ScoreRing score={atsReport.overall_score} size="lg" />
                  <p className="text-sm text-ink-soft leading-relaxed">
                    This score reflects how reliably an automated tracking system could read
                    this resume — formatting and structure only, independent of any specific job.
                  </p>
                </div>
                <AtsChecklist checks={atsReport.checks} />
              </>
            ) : (
              <p className="text-sm text-ink-soft">No ATS report available for this candidate.</p>
            )}
          </Card>

          <Card>
            <h3 className="font-display font-semibold text-sm mb-3">Skills detected</h3>
            <div className="flex flex-wrap gap-1.5">
              {(candidate.extracted_skills || []).length > 0 ? (
                candidate.extracted_skills.map((s) => <Badge key={s} tone="accent">{s}</Badge>)
              ) : (
                <p className="text-sm text-ink-soft">No skills detected in this resume.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-display font-semibold text-sm mb-4">Contact</h3>
            <div className="space-y-2.5">
              {candidate.email && (
                <p className="text-sm text-ink-soft flex items-center gap-2">
                  <LuMail className="h-3.5 w-3.5 shrink-0" /> {candidate.email}
                </p>
              )}
              {candidate.phone && (
                <p className="text-sm text-ink-soft flex items-center gap-2">
                  <LuPhone className="h-3.5 w-3.5 shrink-0" /> {candidate.phone}
                </p>
              )}
              {!candidate.email && !candidate.phone && (
                <p className="text-sm text-ink-soft">No contact info extracted.</p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="font-display font-semibold text-sm mb-4">Background</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-ink-soft flex items-center gap-1.5 mb-1">
                  <LuGraduationCap className="h-3.5 w-3.5" /> Education
                </p>
                <p className="text-sm text-ink">
                  {candidate.education?.length > 0 ? candidate.education.join(", ") : "Not detected"}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-soft flex items-center gap-1.5 mb-1">
                  <LuBriefcase className="h-3.5 w-3.5" /> Experience
                </p>
                <p className="text-sm text-ink">
                  {candidate.experience_years ? `${candidate.experience_years}+ years` : "Not detected"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
