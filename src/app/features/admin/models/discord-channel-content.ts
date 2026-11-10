export interface DiscordChannelContent {
    id: string;
    channelId: string;
    name: string;
    content: string;
    messageIds: string[];
    publishedAt: string | null;
}

export interface DiscordChannelContentRequest {
    channelId: string;
    name: string;
    content: string;
}
