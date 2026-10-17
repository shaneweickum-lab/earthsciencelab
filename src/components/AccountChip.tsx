"use client";

import Link from "next/link";
import { cloudEnabled } from "@/lib/supabase";
import { useAccount } from "@/store/account";

/** Sign-in link in the header, or the signed-in person's name with a sync dot. */
export function AccountChip() {
  const session = useAccount((s) => s.session);
  const profile = useAccount((s) => s.profile);
  const status = useAccount((s) => s.status);
  if (!cloudEnabled) return null;
  const dot = { off: "bg-line", syncing: "bg-sun", saved: "bg-leaf", error: "bg-danger" }[status];
  return (
    <Link
      href={profile?.role === "teacher" ? "/teacher" : "/account"}
      className="flex items-center gap-1.5 rounded-full border-2 border-line bg-card px-2.5 py-1 text-sm font-bold hover:border-sky"
      title={session ? "Your account (progress saved to the cloud)" : "Sign in to save your progress everywhere"}
    >
      {session ? (
        <>
          <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
          <span className="max-w-24 truncate">{profile?.display_name || "Account"}</span>
        </>
      ) : (
        <span>👤 <span className="hidden sm:inline">Sign in</span></span>
      )}
    </Link>
  );
}
