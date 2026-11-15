// Owner-supplied evidence only. Empty slots are intentionally not rendered.
export const founderIdentity: {
  fullName: string | null;
  photo: { src: string; alt: string } | null;
  profiles: { label: string; href: string }[];
} = {
  fullName: null,
  photo: {
    src: "/brand/kof-founder.jpg",
    alt: "Kof, founder of KofSports, at a football game",
  },
  profiles: [
    { label: "Follow KofSports on X", href: "https://x.com/KofSports" },
  ],
};
export type MemberStory = {
  name: string;
  quote: string;
  context: string;
  photo: { src: string; alt: string };
  consentToPublish: boolean;
};
export const memberStories: MemberStory[] = [];
export const independentReview: {
  platform: string;
  href: string;
  rating: number;
  count: number;
  checkedAt: string;
} | null = null;
// Publish only after the owner approves the actual refund policy.
export const approvedRefundStatement: string | null = null;
