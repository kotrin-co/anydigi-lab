import { google, youtube_v3 } from "googleapis";

export class YoutubeClient {
  private readonly youtube: youtube_v3.Youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
  });

  async request<T>(
    fn: (api: youtube_v3.Youtube) => Promise<T>,
    retries = 3,
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn(this.youtube);
      } catch (e) {
        if (i === retries - 1) throw e;

        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }

    throw new Error("unreachable code");
  }
}
