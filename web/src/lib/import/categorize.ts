import type { Category } from "@/lib/db/types";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ["swiggy", "zomato", "restaurant", "cafe", "food", "dining", "dominos", "mcdonald", "kfc", "blinkit", "zepto", "dunzo", "eatfit", "lunch", "dinner"],
  groceries: ["grocery", "groceries", "bigbasket", "jiomart", "dmart", "supermarket", "mart", "kirana"],
  coffee: ["coffee", "starbucks", "cafe", "tea", "chai", "barista"],
  transport: ["uber", "ola", "rapido", "metro", "irctc", "redbus", "parking", "toll", "bus", "train"],
  fuel: ["petrol", "diesel", "fuel", "hpcl", "iocl", "bpcl", "shell", "indianoil"],
  shopping: ["amazon", "flipkart", "myntra", "ajio", "meesho", "store", "retail", "mall"],
  rent: ["rent", "housing", "lease", "landlord"],
  electricity: ["electric", "electricity", "bescom", "mseb", "tneb", "power bill"],
  water: ["water bill", "water supply", "jal board"],
  "gas-utility": ["gas bill", "lpg", "indane", "hp gas"],
  internet: ["broadband", "wifi", "fiber", "act fibernet", "jio fiber", "airtel xstream"],
  recharge: ["recharge", "jio", "airtel", "vi ", "bsnl", "prepaid", "postpaid"],
  bills: ["utility", "bill payment", "maintenance"],
  spotify: ["spotify"],
  youtube: ["youtube", "yt premium", "google *youtube"],
  netflix: ["netflix"],
  "amazon-prime": ["amazon prime", "prime video"],
  subscriptions: ["subscription", "membership", "hotstar", "disney", "apple.com/bill"],
  entertainment: ["bookmyshow", "pvr", "inox", "cinema", "movie", "concert"],
  gaming: ["steam", "playstation", "xbox", "epic games", "gaming"],
  health: ["hospital", "pharmacy", "medplus", "apollo", "clinic", "doctor", "medical", "health", "1mg", "pharmeasy"],
  gym: ["gym", "cult.fit", "fitness", "yoga"],
  education: ["udemy", "coursera", "school", "college", "tuition", "books", "unacademy"],
  travel: ["flight", "indigo", "air india", "makemytrip", "goibibo"],
  hotels: ["hotel", "oyo", "airbnb", "booking.com"],
  gifts: ["gift", "flowers", "ferns n petals"],
  "personal-care": ["salon", "spa", "beauty", "nykaa", "purplle"],
  insurance: ["insurance", "lic", "policy premium"],
  emi: ["emi", "loan repayment", "credit card payment"],
  charity: ["donation", "charity", "temple", "trust"],
  pets: ["pet", "vet", "pedigree"],
  family: ["school fees", "daycare", "kids"],
  work: ["office", "coworking", "stationery"],
  taxes: ["tax", "gst", "tds"],
  salary: ["salary", "payroll", "stipend", "wages"],
  savings: ["interest", "dividend", "refund", "cashback", "credit interest"],
  investment: ["investment", "mutual fund", "zerodha", "groww"],
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
