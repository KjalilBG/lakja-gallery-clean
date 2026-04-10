import { NextResponse } from "next/server";

import {
  findShortLinkBySlug,
  isReservedShortLinkSlug,
  mergeDestinationWithSearchParams,
  normalizeShortLinkSlug,
  registerShortLinkClick
} from "@/lib/short-links";

export async function handleShortLinkRedirect(request: Request, rawSlug: string) {
  const slug = normalizeShortLinkSlug(rawSlug);

  if (!slug || isReservedShortLinkSlug(slug)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const shortLink = await findShortLinkBySlug(slug);

  if (!shortLink || !shortLink.isActive) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const destinationUrl = mergeDestinationWithSearchParams(shortLink.destinationUrl, requestUrl);
  const referer = request.headers.get("referer");
  const sourceHost = (() => {
    if (!referer) return null;

    try {
      return new URL(referer).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();

  await registerShortLinkClick({
    shortLinkId: shortLink.id,
    referer,
    sourceHost,
    utmSource: requestUrl.searchParams.get("utm_source"),
    utmMedium: requestUrl.searchParams.get("utm_medium"),
    utmCampaign: requestUrl.searchParams.get("utm_campaign"),
    country: request.headers.get("x-vercel-ip-country"),
    city: request.headers.get("x-vercel-ip-city"),
    userAgent: request.headers.get("user-agent")
  }).catch((error) => {
    console.error("[short-links] could not record click", error);
  });

  return NextResponse.redirect(destinationUrl, 307);
}
