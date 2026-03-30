import { Suspense } from "react";
import VerifyInviteClient from "./verify-invite-client";

export default function Page() {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <VerifyInviteClient />
        </Suspense>
    );
}
