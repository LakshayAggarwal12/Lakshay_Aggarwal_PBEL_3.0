import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { createJobDescription } from "../../services/jobService";
import { LuBriefcase } from "react-icons/lu";

export default function JobDescriptionForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) {
      toast.error("Add a title and the job description text.");
      return;
    }
    setSubmitting(true);
    try {
      const jd = await createJobDescription({ title: title.trim(), raw_text: rawText.trim() });
      toast.success("Job description saved");
      setTitle("");
      setRawText("");
      onCreated?.(jd);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <LuBriefcase className="h-4 w-4 text-accent" />
        <h3 className="font-display font-semibold text-sm">New job description</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-ink-soft mb-1.5 block">Role title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Full Stack Python Developer"
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-canvas
              focus:bg-surface focus:border-accent outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft mb-1.5 block">Description</label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste the full job description here — required skills, experience level, responsibilities..."
            rows={7}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-border bg-canvas
              focus:bg-surface focus:border-accent outline-none transition-colors resize-none"
          />
        </div>
        <Button type="submit" loading={submitting} className="w-full">
          Save job description
        </Button>
      </form>
    </Card>
  );
}
