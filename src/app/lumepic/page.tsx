import type { Metadata } from "next";

import { LumepicTool } from "@/components/lumepic/lumepic-tool";
import { requireAdminSession } from "@/lib/auth-guard";
import { getLumepicStoredConfig } from "@/lib/lumepic/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lumepic interno | La Kja",
  description: "Herramienta interna para revisar resultados de Lumepic por número.",
  robots: {
    index: false,
    follow: false
  }
};

export default async function LumepicPage() {
  await requireAdminSession("/lumepic");
  const config = await getLumepicStoredConfig();

  return (
    <div className="pb-10 pt-6">
      <LumepicTool initialConfig={config} initialUpdatedAt={config.updatedAt} />
    </div>
  );
}
