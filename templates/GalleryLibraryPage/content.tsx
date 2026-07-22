export type GalleryItem = {
    id: number;
    image: string;
    type: "image" | "video";
};

// Реальные генерации пользователей будут добавлены после подключения хранения.
export const content: GalleryItem[] = [];
