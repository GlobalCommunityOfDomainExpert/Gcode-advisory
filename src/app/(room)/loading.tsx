import { Spinner } from "@/components/atoms";

/** The call door and room while they check who you are and whether the room is open. */
export default function Loading() {
  return (
    <main role="status" aria-busy="true" className="flex min-h-screen items-center justify-center">
      <p className="text-body text-text-secondary flex items-center gap-3">
        <Spinner /> Getting your room ready…
      </p>
    </main>
  );
}
