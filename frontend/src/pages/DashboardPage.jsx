import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Suspense, lazy } from "react";
import { LuUsers, LuBriefcase, LuFileCheck, LuTrendingUp, LuUpload, LuPlus } from "react-icons/lu";
import Topbar from "../components/layout/Topbar";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import CandidateCard from "../components/candidates/CandidateCard";
import EmptyState from "../components/ui/EmptyState";
import { StaggerGrid, StaggerItem } from "../components/ui/StaggerGrid";
import { useAppData } from "../context/AppDataContext";

const AtsDistributionChart = lazy(() => import("../components/dashboard/AtsDistributionChart"));

export default function DashboardPage() {
  const { candidates, jobDescriptions } = useAppData();

  const avgAtsScore =
    candidates.length > 0
      ? Math.round(
          candidates.reduce((sum, c) => sum + (c.ats_report?.overall_score || 0), 0) /
            candidates.length
        )
      : null;

  return (
    <>
      <Topbar
        title="Overview"
        subtitle="Your screening activity"
        actions={
          <>
            <Link to="/candidates">
              <Button variant="secondary" size="sm" icon={LuUpload}>Upload resume</Button>
            </Link>
            <Link to="/jobs">
              <Button size="sm" icon={LuPlus}>New job</Button>
            </Link>
          </>
        }
      />

      <div className="p-6 space-y-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatCard icon={LuUsers} label="Candidates uploaded" value={candidates.length} />
          <StatCard icon={LuBriefcase} label="Job descriptions" value={jobDescriptions.length} />
          <StatCard
            icon={LuFileCheck}
            label="Average ATS score"
            value={avgAtsScore !== null ? `${avgAtsScore}` : "—"}
            hint={avgAtsScore !== null ? "Out of 100" : "Upload a resume to see this"}
          />
        </motion.div>

        {candidates.length > 0 && (
          <Card>
            <h2 className="font-display font-semibold text-sm mb-1">ATS score distribution</h2>
            <p className="text-xs text-ink-soft mb-2">Across all uploaded candidates</p>
            <Suspense fallback={<div className="h-[180px] shimmer rounded-lg" />}>
              <AtsDistributionChart candidates={candidates} />
            </Suspense>
          </Card>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-sm">Recent candidates</h2>
            {candidates.length > 0 && (
              <Link to="/candidates" className="text-xs font-medium text-accent hover:underline">
                View all
              </Link>
            )}
          </div>

          {candidates.length === 0 ? (
            <Card>
              <EmptyState
                icon={LuUsers}
                title="No candidates yet"
                description="Upload a resume to see it parsed, scored, and ready for ranking against a job description."
                action={
                  <Link to="/candidates">
                    <Button size="sm" icon={LuUpload}>Upload a resume</Button>
                  </Link>
                }
              />
            </Card>
          ) : (
            <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.slice(0, 4).map((c) => (
                <StaggerItem key={c.id}>
                  <CandidateCard candidate={c} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          )}
        </div>

        {jobDescriptions.length === 0 && candidates.length > 0 && (
          <Card className="border-accent/30 bg-accent-soft/40">
            <div className="flex items-center gap-3">
              <LuTrendingUp className="h-5 w-5 text-accent shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">Ready to rank candidates</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  Add a job description to see how your uploaded candidates match up.
                </p>
              </div>
              <Link to="/jobs">
                <Button size="sm">Add job description</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
