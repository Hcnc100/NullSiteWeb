import type { ImageItem } from "ng-gallery";

export interface GalleryModel<T> {
    data: T,
    imageItem: ImageItem
}