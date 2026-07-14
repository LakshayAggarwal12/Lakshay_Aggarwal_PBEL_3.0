import { useState, useRef, useCallback } from "react";
import { LuUpload, LuFileText, LuX } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import { uploadResume } from "../../services/candidateService";

const ALLOWED_TYPES = [".pdf", ".docx"];
const MAX_SIZE_MB = 5;

function validateFile(file) {
  const ext = "." + file.name.split(".").pop().toLowerCase();
  if (!ALLOWED_TYPES.includes(ext)) {
    return `Unsupported file type. Upload a PDF or DOCX resume.`;
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File is larger than ${MAX_SIZE_MB}MB.`;
  }
  return null;
}

export default function UploadDropzone({ onUploaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState([]); // [{ id, file, status, error }]
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList);
      const entries = files.map((file) => {
        const error = validateFile(file);
        return {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          status: error ? "error" : "uploading",
          error,
        };
      });

      setQueue((prev) => [...entries, ...prev]);

      entries
        .filter((e) => e.status === "uploading")
        .forEach(async (entry) => {
          try {
            const result = await uploadResume(entry.file);
            setQueue((prev) =>
              prev.map((e) => (e.id === entry.id ? { ...e, status: "done" } : e))
            );
            toast.success(`${entry.file.name} parsed successfully`);
            onUploaded?.(result);
          } catch (err) {
            setQueue((prev) =>
              prev.map((e) =>
                e.id === entry.id ? { ...e, status: "error", error: err.message } : e
              )
            );
            toast.error(`Couldn't process ${entry.file.name}`);
          }
        });
    },
    [onUploaded]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const removeEntry = (id) => setQueue((prev) => prev.filter((e) => e.id !== id));

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed cursor-pointer
          transition-colors duration-150 px-6 py-12 flex flex-col items-center text-center
          ${isDragging ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent/50"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          multiple
          className="hidden"
          onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
        />
        <div className="h-11 w-11 rounded-full bg-accent-soft flex items-center justify-center mb-3">
          <LuUpload className="h-5 w-5 text-accent" />
        </div>
        <p className="text-sm font-medium text-ink">Drop resumes here, or click to browse</p>
        <p className="text-xs text-ink-soft mt-1">PDF or DOCX, up to {MAX_SIZE_MB}MB each</p>
      </div>

      <AnimatePresence initial={false}>
        {queue.length > 0 && (
          <div className="space-y-2">
            {queue.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 bg-surface border border-border rounded-lg px-3.5 py-2.5"
              >
                <LuFileText className="h-4 w-4 text-ink-soft shrink-0" />
                <span className="text-sm text-ink truncate flex-1">{entry.file.name}</span>

                {entry.status === "uploading" && (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
                )}
                {entry.status === "done" && (
                  <span className="text-xs font-medium text-score-high shrink-0">Parsed</span>
                )}
                {entry.status === "error" && (
                  <span className="text-xs font-medium text-score-low shrink-0">{entry.error}</span>
                )}
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="text-ink-soft hover:text-ink shrink-0"
                  aria-label="Remove"
                >
                  <LuX className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
