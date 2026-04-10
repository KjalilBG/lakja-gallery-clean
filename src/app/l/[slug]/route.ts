import { handleShortLinkRedirect } from "@/lib/short-link-routing";

export const dynamic = "force-dynamic";

type ShortLinkPrefixedRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, { params }: ShortLinkPrefixedRouteProps) {
  const resolvedParams = await params;
  return handleShortLinkRedirect(request, resolvedParams.slug ?? "");
}
