import {
  YoutubeClient,
  VideoService,
  ChannelService,
  VideoCategoryService,
  CommentService,
} from "../services";
import * as logger from "firebase-functions/logger";
import { youtube_v3 } from "googleapis";
import { getChunks } from "../utils";
import {
  PopularVideoRepository,
  VideoCommentRepository,
} from "../repositories/bigquery";
import { VIDEO_CATEGORIES } from "../constants/youtube";

export class PopularVideosService {
  private readonly videoService: VideoService;
  private readonly channelService: ChannelService;
  private readonly videoCategoryService: VideoCategoryService;
  private readonly commentService: CommentService;
  private readonly popularVideoRepository = new PopularVideoRepository();
  private readonly videoCommentRepository = new VideoCommentRepository();
  private readonly regionCode = "JP";

  constructor() {
    const client = new YoutubeClient();
    this.videoService = new VideoService(client);
    this.channelService = new ChannelService(client);
    this.videoCategoryService = new VideoCategoryService(client);
    this.commentService = new CommentService(client);
  }

  async execute() {
    try {
      // 最新（全カテゴリ）
      const latestVideos = await this.videoService.fetchPopularVideos(
        this.regionCode,
      );

      await this.processCategoryVideos("最新", latestVideos);

      // カテゴリ別
      const categories = await this.videoCategoryService.fetchVideoCategories(
        this.regionCode,
      );

      for (const category of categories) {
        const categoryId = category.id;
        if (!categoryId) {
          logger.warn("Category without ID found, skipping", { category });
          continue;
        }

        const categoryTitle =
          category.snippet?.title ?? VIDEO_CATEGORIES[categoryId] ?? "Unknown";

        try {
          const videos = await this.videoService.fetchPopularVideos(
            this.regionCode,
            categoryId,
          );

          await this.processCategoryVideos(categoryTitle, videos);
        } catch (error) {
          logger.error(
            `Error fetching videos for category ${categoryTitle}, skipping`,
            { error },
          );
          continue;
        }
      }
    } catch (error) {
      logger.error("Error executing save-popular-videos", { error });
      throw error;
    }
  }

  private async processCategoryVideos(
    categoryTitle: string,
    videos: youtube_v3.Schema$Video[],
  ) {
    try {
      logger.info(
        `Processing category: ${categoryTitle}, videos count: ${videos.length}`,
      );

      const videoChunks = getChunks(videos);

      for (const chunk of videoChunks) {
        const channelIds = [
          ...new Set(
            chunk.map((video) => video.snippet?.channelId).filter(Boolean),
          ),
        ];

        const channels = await this.channelService.fetchChannels(channelIds);

        const channelMap = new Map(
          channels
            .filter((c) => c.id)
            .map((channel) => [channel.id ?? "", channel]),
        );

        await this.popularVideoRepository.saveVideos(
          this.regionCode,
          categoryTitle,
          chunk,
          channelMap,
        );

        // コメント処理
        const comments: youtube_v3.Schema$CommentThread[] = [];
        for (const video of chunk) {
          if (!video.id) continue;

          try {
            const videoComments = await this.commentService.fetchComments(
              video.id,
            );
            comments.push(...videoComments);
          } catch (error) {
            logger.error(
              `Error fetching comments for video ${video.id}, skipping`,
              {
                error,
              },
            );
            continue;
          }
        }

        await this.videoCommentRepository.saveComments(comments);
      }
    } catch (error) {
      logger.error(`Error processing videos for category ${categoryTitle}`, {
        error,
      });
      return;
    }
  }
}
