import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";

import { sanityClient } from "@/sanity/lib/client";

const imageBuilder = createImageUrlBuilder(sanityClient);

export function urlForImage(source: SanityImageSource) {
  return imageBuilder.image(source).auto("format").fit("max");
}