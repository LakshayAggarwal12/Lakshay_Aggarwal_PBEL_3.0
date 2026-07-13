import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LuArrowLeft, LuSparkles, LuUsers } from "react-icons/lu";
import Topbar from "../components/layout/Topbar";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import RankingTable from "../components/ranking/RankingTable";
import ComparisonPanel from "../components/ranking/ComparisonPanel";
import { SkeletonRow, SkeletonCard } from "../components/ui/Skeleton";
import { useAppData } from "../context/AppDataContext";
import { rankCandidates, getJobDescription } from "../services/jobService";

const MAX_COMPARE = 3;

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getJobDescriptionById, candidates, loading: listLoading } = useAppData();
  const fromList = getJobDescriptionById(Number(id));

  const [fetched, setFetched] = useState(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Same cross-device fallback as CandidateDetailPage: if this JD wasn't
  // in the already-loaded list, fetch it directly by id.
  useEffect(() => {
    if (fromList || listLoading) return;
    let cancelled = false;
    setFetching(true);
    getJobDescription(Number(id))
      .then((jd) => {
        if (!cancelled) setFetched(jd);
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

  const jd = fromList || fetched;

  const [rankings, setRankings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  const compareList = useMemo(
    () => (rankings || []).filter((r) => compareIds.includes(r.candidate_id)),
    [rankings, compareIds]
  );

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

  if (!jd || fetchFailed) {
    return (
      <>
        <Topbar title="Job not found" />
        <div className="p-6 max-w-4xl">
          <Card>
            <EmptyState
              title="Job description not found"
              description="This job description doesn't exist, or may have been removed."
              action={<Button onClick={() => navigate("/jobs")} size="sm">Back to jobs</Button>}
            />
          </Card>
        </div>
      </>
    );
  }

  const handleRank = async () => {
    setLoading(true);
    try {
      const result = await rankCandidates(jd.id);
      setRankings(result.rankings);
      setCompareIds([]);
      toast.success(`Ranked ${result.total_candidates} candidate(s)`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompare = (candidate) => {
    setCompareIds((prev) => {
      if (prev.includes(candidate.candidate_id)) {
        return prev.filter((id) => id !== candidate.candidate_id);
      }
      if (prev.length >= MAX_COMPARE) {
        toast.error(`You can compare up to ${MAX_COMPARE} candidates at once`);
        return prev;
      }
      return [...prev, candidate.candidate_id];
    });
  };

  return (
    <>
      <Topbar
        title={jd.title}
        subtitle="Job description"
        actions={
          <Button variant="ghost" size="sm" icon={LuArrowLeft} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="p-6 max-w-5xl space-y-6">
        <Card>
          <h3 className="font-display font-semibold text-sm mb-2">Description</h3>
          <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">{jd.raw_text}</p>
          {jd.required_skills?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-soft">
              <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
                Required skills detected
              </p>
              <div className="flex flex-wrap gap-1.5">
                {jd.required_skills.map((s) => (
                  <Badge key={s} tone="accent">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-sm">Candidate ranking</h3>
              {rankings && (
                <p className="text-xs text-ink-soft mt-0.5">
                  Select up to {MAX_COMPARE} candidates to compare side by side
                </p>
              )}
            </div>
            <Button size="sm" icon={LuSparkles} onClick={handleRank} loading={loading}>
              {rankings ? "Re-run ranking" : "Rank candidates"}
            </Button>
          </div>

          {loading ? (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : rankings ? (
            <>
              <RankingTable rankings={rankings} selectedIds={compareIds} onToggleSelect={toggleCompare} />
              {compareList.length > 0 && (
                <ComparisonPanel
                  candidates={compareList}
                  onRemove={(cid) => setCompareIds((prev) => prev.filter((id) => id !== cid))}
                  onClose={() => setCompareIds([])}
                />
              )}
            </>
          ) : (
            <Card>
              <EmptyState
                icon={LuUsers}
                title="Not ranked yet"
                description={
                  candidates.length === 0
                    ? "No candidates uploaded yet — upload at least one resume before ranking."
                    : `Run ranking to score all ${candidates.length} uploaded candidate(s) against this job description.`
                }
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
