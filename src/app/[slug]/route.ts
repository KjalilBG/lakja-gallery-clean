import { handleShortLinkRedirect } from "@/lib/short-link-routing";

export const dynamic = "force-dynamic";

type ShortLinkRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: Request, { params }: ShortLinkRouteProps) {
  const resolvedParams = await params;
  return handleShortLinkRedirect(request, resolvedParams.slug ?? "");
}
