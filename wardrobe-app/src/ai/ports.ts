import type { Result } from '@/domain/types';
import type { ImageMediaType } from './claudeMessages';
import type { ProductPageData } from '@/services/productPage/extractProductPage';

/** Platform services the AI clients need, injected so the clients stay testable without Expo. */
export interface EncodedImage {
  base64: string;
  mediaType: ImageMediaType;
}

export type ReadImage = (uri: string) => Promise<Result<EncodedImage>>;

export type FetchProductPage = (url: string, signal?: AbortSignal) => Promise<Result<ProductPageData>>;
