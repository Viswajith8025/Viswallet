import type { Category } from "@/lib/db/types";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ["swiggy", "zomato", "restaurant", "cafe", "food", "dining", "dominos", "mcdonald", "kfc", "blinkit", "zepto", "dunzo"],
  transport: ["uber", "ola", "rapido", "petrol", "fuel", "metro", "irctc", "redbus", "parking", "toll"],
  shopping: ["amazon", "flipkart", "myntra", "ajio", "meesho", "store", "mart", "retail"],
  bills: ["electric", "electricity", "water", "gas", "broadband", "wifi", "recharge", "jio", "airtel", "vi ", "bsnl"],
  subscriptions: ["netflix", "spotify", "prime", "hotstar", "youtube", "subscription", "membership"],
  entertainment: ["bookmyshow", "pvr", "inox", "game", "cinema", "movie"],
  health: ["hospital", "pharmacy", "medplus", "apollo", "clinic", "doctor", "medical", "health"],
  education: ["udemy", "coursera", "school", "college", "tuition", "books"],
  savings: ["salary", "interest", "dividend", "refund", "cashback", "credit interest"],
  misc: [],
};

export function inferCategorySlug(description: string): string {
  const text = description.toLowerCase();
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (slug === "misc") continue;
    if (keywords.some((word) => text.includes(word))) return slug;
  }
  return "misc";
}

export function inferPaymentMethod(description: string): string {
  const text = description.toLowerCase();
  if (text.includes("upi") || text.includes("gpay") || text.includes("phonepe") || text.includes("paytm")) {
    return "UPI";
  }
  if (text.includes("neft") || text.includes("imps") || text.includes("rtgs") || text.includes("net banking")) {
    return "Net Banking";
  }
  if (text.includes("card") || text.includes("pos") || text.includes("debit") || text.includes("credit card")) {
    return "Card";
  }
  if (text.includes("cash") || text.includes("atm")) return "Cash";
  if (text.includes("auto debit") || text.includes("ecs") || text.includes("nach")) return "Auto Debit";
  return "Card";
}

export function resolveCategoryId(categories: Category[], slug: string): number | undefined {
  const match = categories.find((c) => c.slug === slug);
  if (match?.id != null) return match.id;
  const byName = categories.find((c) => c.name.toLowerCase() === slug.toLowerCase());
  if (byName?.id != null) return byName.id;
  return categories.find((c) => c.slug === "misc")?.id ?? categories[0]?.id;
}
