import { useState, useMemo, useEffect } from "react";
import { LuUsers } from "react-icons/lu";
import Topbar, { SearchInput } from "../components/layout/Topbar";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import UploadDropzone from "../components/candidates/UploadDropzone";
import CandidateCard from "../components/candidates/CandidateCard";
import { StaggerGrid, StaggerItem } from "../components/ui/StaggerGrid";
import SortDropdown from "../components/ui/SortDropdown";
import Pagination from "../components/ui/Pagination";
import { SkeletonCard } from "../components/ui/Skeleton";
import { useAppData } from "../context/AppDataContext";

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "name", label: "Name (A–Z)" },
  { value: "ats_desc", label: "ATS score (high to low)" },
  { value: "ats_asc", label: "ATS score (low to high)" },
];

export default function CandidatesPage() {
  const { candidates, addCandidate, loading } = useAppData();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return candidates;
    const q = query.toLowerCase();
    return candidates.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.filename?.toLowerCase().includes(q) ||
        c.extracted_skills?.some((s) => s.toLowerCase().includes(q))
    );
  }, [candidates, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "name":
        return list.sort((a, b) => (a.full_name || a.filename).localeCompare(b.full_name || b.filename));
      case "ats_desc":
        return list.sort((a, b) => (b.ats_report?.overall_score ?? -1) - (a.ats_report?.overall_score ?? -1));
      case "ats_asc":
        return list.sort((a, b) => (a.ats_report?.overall_score ?? 101) - (b.ats_report?.overall_score ?? 101));
      case "recent":
      default:
        return list; // already newest-first from AppDataContext
    }
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 whenever the filtered/sorted set changes shape
  useEffect(() => setPage(1), [query, sort, candidates.length]);

  return (
    <>
      <Topbar
        title="Candidates"
        subtitle={`${candidates.length} uploaded`}
        actions={
          candidates.length > 0 && (
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, file, or skill..."
            />
          )
        }
      />

      <div className="p-6 space-y-6 max-w-6xl">
        <Card>
          <h3 className="font-display font-semibold text-sm mb-4">Upload resumes</h3>
          <UploadDropzone onUploaded={(result) => addCandidate(result.candidate, result.ats_report)} />
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : candidates.length === 0 ? (
          <Card>
            <EmptyState
              icon={LuUsers}
              title="No candidates uploaded yet"
              description="Drop a PDF or DOCX resume above to parse it, extract skills, and check ATS parseability."
            />
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={LuUsers}
              title="No matches"
              description={`Nothing found for "${query}". Try a different search term.`}
            />
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-soft">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
              </p>
              <SortDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
            </div>

            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginated.map((c) => (
                <StaggerItem key={c.id}>
                  <CandidateCard candidate={c} />
                </StaggerItem>
              ))}
            </StaggerGrid>

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
