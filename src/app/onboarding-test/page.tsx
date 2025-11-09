// src/app/notifs-test/page.tsx
"use client";

import InviteCard from "@/components/onboarding/inviteCard";
import {
  InvitationSentCard,
  RemoveUserCard,
  UserRemovedCard,
  AccountCreatedCard,
  ResendInviteCard,
} from "@/components/onboarding/notifCard";

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-10 py-12">
        <InviteCard />
        <InvitationSentCard showOverlay={false} />
        <RemoveUserCard showOverlay={false} />
        <UserRemovedCard showOverlay={false} />
        <AccountCreatedCard showOverlay={false} />
        <ResendInviteCard showOverlay={false} />
    </main>
  );
}
