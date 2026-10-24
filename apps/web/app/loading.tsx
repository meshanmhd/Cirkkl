import { LoadingAnimation } from "@/components/ui/LoadingAnimation";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingAnimation width={300} height={300} />
    </div>
  );
}
