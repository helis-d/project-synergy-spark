import { createFileRoute } from "@tanstack/react-router";
import { NorthApp } from "@/components/north/NorthApp";

const title = "North — Akış modlu yazı editörü";
const description =
  "Canlı taslak, dallanma, Markdown ve sesli dikte destekli yazı editörü. Mobilde ve masaüstünde çalışır, yazdıklarını cihazında saklar.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <h1 className="sr-only">North — akış modlu, dallanma destekli yazı editörü</h1>
      <NorthApp />
    </>
  );
}
