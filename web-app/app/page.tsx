"use client";

import { useState } from "react";
import { GeneratedUrlDisplay } from "../components/generated-url-display";
import { UrlForm } from "../components/url-form";

type Status = "idle" | "generating" | "generated";

type UrlEntry = { id: string; value: string };

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [urls, setUrls] = useState<UrlEntry[]>([
    { id: crypto.randomUUID(), value: "" },
  ]);
  const [shortUrl, setShortUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isUsingCustomWeights, setIsUsingCustomWeights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateShortLink(weights?: number[]) {
    setStatus("generating");
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/generate-link`,
        {
          method: "POST",
          body: JSON.stringify({
            urls: urls.map((entry, i) => ({
              original_url: entry.value,
              weight: weights?.[i] ?? 1,
            })),
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to generate short link.");
        setStatus("idle");
        return;
      }

      const { short_code, expires_at } = await res.json();

      setUrls([{ id: crypto.randomUUID(), value: "" }]);
      setShortUrl(`${process.env.NEXT_PUBLIC_API_URL}/${short_code}`);
      setExpiresAt(expires_at ?? null);
      setStatus("generated");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setStatus("idle");
    }
  }

  function copyGeneratedUrl() {
    navigator.clipboard.writeText(shortUrl);
    setIsCopied(true);
  }

  function reset() {
    setUrls([{ id: crypto.randomUUID(), value: "" }]);
    setIsCopied(false);
    setExpiresAt(null);
    setError(null);
    setStatus("idle");
  }

  return (
    <main className="min-h-[calc(100dvh-5rem)] px-10 pt-20">
      <p className="text-center text-3xl font-bold">
        One link, multiple destinations.
      </p>
      <p className="mx-auto mt-5 max-w-xl text-center opacity-70">
        Create a single short link that intelligently distributes traffic across
        multiple destinations. Perfect for A/B testing, gradual rollouts, or
        simply splitting an audience — no code required.
      </p>
      <div className="mx-auto mt-20 max-w-sm">
        {status !== "generated" ? (
          <>
            {error && (
              <p className="mb-4 text-center text-sm text-destructive">
                {error}
              </p>
            )}
            <UrlForm
              urls={urls.map((e) => e.value)}
              urlIds={urls.map((e) => e.id)}
              onUrlChange={(i, value) =>
                setUrls((current) => {
                  const next = [...current];
                  next[i] = { ...next[i], value };
                  return next;
                })
              }
              onAddUrl={() =>
                setUrls((current) => [
                  ...current,
                  { id: crypto.randomUUID(), value: "" },
                ])
              }
              onRemoveUrl={(i) =>
                setUrls((current) => current.filter((_, idx) => idx !== i))
              }
              onGenerate={generateShortLink}
              isGenerating={status === "generating"}
              isUsingCustomWeights={isUsingCustomWeights}
              setIsUsingCustomWeights={setIsUsingCustomWeights}
            />
          </>
        ) : (
          <GeneratedUrlDisplay
            shortUrl={shortUrl}
            expiresAt={expiresAt}
            isCopied={isCopied}
            onCopy={copyGeneratedUrl}
            onReset={reset}
          />
        )}
      </div>
    </main>
  );
}
