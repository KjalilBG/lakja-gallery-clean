import { ImageResponse } from "next/og";
import { createElement } from "react";

import { getAlbumBySlug } from "@/lib/albums";
import { toMediaRoute } from "@/lib/r2";
import { getSiteSettings, resolveAppUrl, resolveSiteShareImageUrl } from "@/lib/site-settings";

export const runtime = "nodejs";
export const revalidate = 300;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const imageSize = {
  width: 1200,
  height: 630
} as const;

function trimText(value: string | null | undefined, maxLength: number) {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function resolveAbsoluteImageUrl(input: string | null | undefined) {
  if (!input) {
    return null;
  }

  return /^https?:\/\//i.test(input) ? input : `${resolveAppUrl()}${input.startsWith("/") ? input : `/${input}`}`;
}

export async function GET(_: Request, context: RouteContext) {
  const { slug } = await context.params;
  const [album, siteSettings] = await Promise.all([getAlbumBySlug(slug), getSiteSettings()]);

  const albumTitle = album?.title?.trim() || siteSettings.shareTitle;
  const albumDescription =
    trimText(album?.description, 160) ||
    trimText(album?.clientName ? `${album.clientName} en La Kja.` : "", 160) ||
    trimText(siteSettings.shareDescription, 160);
  const coverImageUrl = resolveAbsoluteImageUrl(
    album?.coverPhoto ? toMediaRoute(album.coverPhoto.previewKey ?? album.coverPhoto.originalKey) : resolveSiteShareImageUrl(siteSettings.shareImageUrl)
  );
  const visibilityLabel = album?.visibility === "PASSWORD" ? "Galeria privada" : "Galeria lista para compartir";
  const h = createElement;

  return new ImageResponse(
    h(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(8,15,28,1) 0%, rgba(16,24,40,1) 40%, rgba(255,64,156,1) 100%)",
          color: "#fff"
        }
      },
      coverImageUrl
        ? h("img", {
            src: coverImageUrl,
            alt: albumTitle,
            style: {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.28
            }
          })
        : null,
      h("div", {
        style: {
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(7,10,20,0.92) 0%, rgba(7,10,20,0.76) 48%, rgba(7,10,20,0.25) 100%)"
        }
      }),
      h(
        "div",
        {
          style: {
            position: "relative",
            zIndex: 1,
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "56px 58px",
            justifyContent: "space-between",
            gap: "36px"
          }
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "64%"
            }
          },
          h(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "22px"
              }
            },
            h(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "16px"
                }
              },
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "999px",
                    padding: "12px 18px",
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase"
                  }
                },
                "La Kja"
              ),
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "999px",
                    padding: "12px 18px",
                    background: "rgba(255,64,156,0.18)",
                    border: "1px solid rgba(255,64,156,0.45)",
                    color: "#ffd2e8",
                    fontSize: 20,
                    fontWeight: 700
                  }
                },
                visibilityLabel
              )
            ),
            h(
              "div",
              {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px"
                }
              },
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    fontSize: 62,
                    fontWeight: 800,
                    lineHeight: 1.03,
                    letterSpacing: "-0.04em"
                  }
                },
                trimText(albumTitle, 68)
              ),
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    fontSize: 28,
                    lineHeight: 1.4,
                    color: "rgba(255,255,255,0.82)"
                  }
                },
                albumDescription
              )
            )
          ),
          h(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontSize: 22,
                color: "rgba(255,255,255,0.76)"
              }
            },
            h("div", {
              style: {
                display: "flex",
                width: "12px",
                height: "12px",
                borderRadius: "999px",
                background: "#6aff94"
              }
            }),
            "Comparte el enlace y deja que el preview haga su magia."
          )
        ),
        h(
          "div",
          {
            style: {
              display: "flex",
              width: "28%",
              minWidth: "280px",
              alignSelf: "stretch",
              borderRadius: "34px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 24px 90px rgba(0,0,0,0.22)",
              background: "rgba(255,255,255,0.08)"
            }
          },
          coverImageUrl
            ? h("img", {
                src: coverImageUrl,
                alt: albumTitle,
                style: {
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }
              })
            : h("div", {
                style: {
                  display: "flex",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(145deg, rgba(255,64,156,0.86) 0%, rgba(255,188,55,0.72) 100%)"
                }
              })
        )
      )
    ),
    imageSize
  );
}
