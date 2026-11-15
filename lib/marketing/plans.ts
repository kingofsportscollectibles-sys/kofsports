type PlanKey =
  | "one_day"
  | "weekly"
  | "monthly"
  | "ninety_day"
  | "pro_monthly"
  | "pro_annual";

type Plan = {
  name: string;
  duration: string;
  price: string;
  billingLabel: string;
  description: string;
  popular: boolean;
  planKey: PlanKey;
  buttonLabel: string;
  features: string[];
};

export const premiumPlans: Plan[] = [
  {
    name: "1-Day Premium Pass",
    duration: "24 hours",
    price: "$10",
    billingLabel: "One-time payment",
    description:
      "Get complete access to every active Premium Pick plus KofSports Pro for the next 24 hours.",
    popular: false,
    planKey: "one_day",
    buttonLabel: "Get 1-Day Access",
    features: [
      "All active Premium Picks",
      "Complete pick analysis",
      "Confidence ratings",
      "Recommended unit sizing",
      "KofSports Pro included",
      "No recurring charges",
    ],
  },
  {
    name: "Weekly Premium Pass",
    duration: "7 days",
    price: "$25",
    billingLabel: "Renews weekly",
    description:
      "Stay connected to every KofSports pick and unlock the full KofSports Pro research platform.",
    popular: true,
    planKey: "weekly",
    buttonLabel: "Start Weekly Access",
    features: [
      "Every official KofSports pick",
      "Detailed betting analysis",
      "Confidence ratings and units",
      "All sports included",
      "KofSports Pro included",
      "Cancel anytime",
    ],
  },
  {
    name: "Monthly Premium Pass",
    duration: "30 days",
    price: "$75",
    billingLabel: "Renews monthly",
    description:
      "Complete Premium access plus KofSports Pro throughout the month.",
    popular: false,
    planKey: "monthly",
    buttonLabel: "Start Monthly Access",
    features: [
      "Every official KofSports pick",
      "Complete betting analysis",
      "Confidence ratings and units",
      "All sports included",
      "KofSports Pro included",
      "Cancel anytime",
    ],
  },
  {
    name: "90-Day Premium Pass",
    duration: "90 days",
    price: "$199",
    billingLabel: "Renews every 90 days",
    description:
      "Our best long-term Premium value with uninterrupted access to picks and KofSports Pro.",
    popular: false,
    planKey: "ninety_day",
    buttonLabel: "Start 90-Day Access",
    features: [
      "Every official KofSports pick",
      "Complete analysis and results",
      "Confidence ratings and units",
      "All sports included",
      "KofSports Pro included",
      "Best Premium price per day",
    ],
  },
];

export const proPlans: Plan[] = [
  {
    name: "Pro Monthly",
    duration: "Monthly",
    price: "$9.99",
    billingLabel: "Renews monthly",
    description:
      "Get the KofSports research platform without a Premium Picks subscription.",
    popular: false,
    planKey: "pro_monthly",
    buttonLabel: "Start Pro Monthly",
    features: [
      "Full NFL Prop Research board",
      "KOF Over Score rankings",
      "Advanced L5, L10, season & H2H data",
      "Edge vs current sportsbook line",
      "Defense vs Position analysis",
      "Snap share and player usage",
      "Expanded prop research",
      "Cancel anytime",
    ],
  },
  {
    name: "Pro Annual",
    duration: "Annual",
    price: "$79",
    billingLabel: "Renews annually",
    description:
      "Year-round access to the KofSports research platform at our best Pro value.",
    popular: true,
    planKey: "pro_annual",
    buttonLabel: "Get Pro Annual",
    features: [
      "Everything in KofSports Pro",
      "Save $40.88 a year vs monthly",
      "Full NFL research platform",
      "Advanced prop research",
      "Future Pro features included",
      "Future sports tools as added",
      "Cancel anytime",
    ],
  },
];
