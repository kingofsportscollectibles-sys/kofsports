import { createClient } from "next-sanity";

import { sanityEnv } from "@/sanity/lib/env";

export const client = createClient({
  projectId: sanityEnv.projectId,
  dataset: sanityEnv.dataset,
  apiVersion: sanityEnv.apiVersion,
  useCdn: true,
  perspective: "published",
});

export const sanityClient = client;