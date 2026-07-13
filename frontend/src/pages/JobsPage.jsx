import { useNavigate } from "react-router-dom";
import { LuBriefcase } from "react-icons/lu";
import Topbar from "../components/layout/Topbar";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import JobDescriptionForm from "../components/jobs/JobDescriptionForm";
import JobDescriptionCard from "../components/jobs/JobDescriptionCard";
import { StaggerGrid, StaggerItem } from "../components/ui/StaggerGrid";
import { SkeletonCard } from "../components/ui/Skeleton";
import { useAppData } from "../context/AppDataContext";

export default function JobsPage() {
  const { jobDescriptions, addJobDescription, loading } = useAppData();
  const navigate = useNavigate();

  return (
    <>
      <Topbar
        title="Job descriptions"
        subtitle={loading ? "Loading..." : `${jobDescriptions.length} total`}
      />

      <div className="p-6 max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <JobDescriptionForm
            onCreated={(jd) => {
              addJobDescription(jd);
              navigate(`/jobs/${jd.id}`);
            }}
          />
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : jobDescriptions.length === 0 ? (
            <Card>
              <EmptyState
                icon={LuBriefcase}
                title="No job descriptions yet"
                description="Add one on the left to start ranking your uploaded candidates against it."
              />
            </Card>
          ) : (
            <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobDescriptions.map((jd) => (
                <StaggerItem key={jd.id}>
                  <JobDescriptionCard jd={jd} />
                </StaggerItem>
              ))}
            </StaggerGrid>
          )}
        </div>
      </div>
    </>
  );
}
