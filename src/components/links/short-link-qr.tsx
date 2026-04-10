import QRCode from "qrcode";

type ShortLinkQrProps = {
  url: string;
  label: string;
};

export async function ShortLinkQr({ url, label }: ShortLinkQrProps) {
  const qrDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: {
      dark: "#0f172a",
      light: "#ffffff"
    }
  });

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">QR</p>
      <div className="mt-3 overflow-hidden rounded-[18px] border border-slate-200 bg-white p-3">
        <img src={qrDataUrl} alt={`QR de ${label}`} className="h-full w-full rounded-[12px]" />
      </div>
      <a
        href={qrDataUrl}
        download={`${label}.png`}
        className="mt-3 inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
      >
        Descargar QR
      </a>
    </div>
  );
}
