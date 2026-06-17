import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";

export type RecognizedSong = {
  title: string;
  artist: string;
  album?: string;
  releaseDate?: string;
};

export const recognizeAudio = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      audioBase64: z.string().min(100).max(10_000_000),
      mime: z.string().min(3).max(64),
    }),
  )
  .handler(async ({ data }) => {
    const host = process.env.ACRCLOUD_HOST;
    const accessKey = process.env.ACRCLOUD_ACCESS_KEY;
    const accessSecret = process.env.ACRCLOUD_ACCESS_SECRET;
    if (!host || !accessKey || !accessSecret) {
      throw new Error("ACRCloud is not configured");
    }

    const httpMethod = "POST";
    const httpUri = "/v1/identify";
    const dataType = "audio";
    const signatureVersion = "1";
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const stringToSign = [
      httpMethod,
      httpUri,
      accessKey,
      dataType,
      signatureVersion,
      timestamp,
    ].join("\n");

    const signature = crypto
      .createHmac("sha1", accessSecret)
      .update(Buffer.from(stringToSign, "utf-8"))
      .digest("base64");

    const audioBuf = Buffer.from(data.audioBase64, "base64");

    const form = new FormData();
    form.append(
      "sample",
      new Blob([new Uint8Array(audioBuf)], { type: data.mime }),
      "sample.webm",
    );
    form.append("sample_bytes", String(audioBuf.length));
    form.append("access_key", accessKey);
    form.append("data_type", dataType);
    form.append("signature_version", signatureVersion);
    form.append("signature", signature);
    form.append("timestamp", timestamp);

    const res = await fetch(`https://${host}${httpUri}`, {
      method: "POST",
      body: form,
    });
    const json = (await res.json()) as any;

    if (json?.status?.code !== 0) {
      return {
        ok: false as const,
        message: json?.status?.msg ?? "No match",
        code: json?.status?.code ?? -1,
      };
    }

    const music = json?.metadata?.music?.[0];
    if (!music) {
      return { ok: false as const, message: "No match", code: 1001 };
    }

    const song: RecognizedSong = {
      title: music.title ?? "Unknown",
      artist: (music.artists ?? []).map((a: any) => a.name).join(", ") || "Unknown",
      album: music.album?.name,
      releaseDate: music.release_date,
    };
    return { ok: true as const, song };
  });
