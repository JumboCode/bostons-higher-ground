// Response.redirect requires an absolute URL; a relative one throws (HTTP 500).
export function GET(request: Request) {
    return Response.redirect(new URL("/onboarding/verify-invite", request.url));
}
