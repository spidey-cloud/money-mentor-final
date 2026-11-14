import * as React from "react";
import { useReview } from "../../context/ReviewContext";
import { TestimonialGlobe } from "./testimonial-globe";

// Default base reviews spread across major global financial cities
export const BASE_GLOBE_REVIEWS = [
  {
    id: "mumbai",
    quote: "MoneyMentor's Tax Wizard showed me how to save ₹48,000 using Section 80CCD NPS and optimized HRA. It took just 3 minutes!",
    name: "Aakash Mehta",
    role: "Senior Product Manager",
    company: "FinTech Innovations",
    city: "Mumbai",
    country: "IN",
    lat: 19.076,
    lng: 72.8777,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    tone: 1,
  },
  {
    id: "bengaluru",
    quote: "The FIRE Planner gave me a realistic month-by-month roadmap to early retirement. Calculating my corpus taking inflation into account changed everything.",
    name: "Priyanka Nair",
    role: "Staff Software Engineer",
    company: "CloudScale Systems",
    city: "Bengaluru",
    country: "IN",
    lat: 12.9716,
    lng: 77.5946,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    tone: 2,
  },
  {
    id: "london",
    quote: "As an NRI in London, I finally have a tool that understands Indian tax slabs and helps me plan repatriation efficiently.",
    name: "Rahul Sharma",
    role: "Investment Banker",
    company: "Barclays Capital",
    city: "London",
    country: "GB",
    lat: 51.5074,
    lng: -0.1278,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    tone: 3,
  },
  {
    id: "singapore",
    quote: "The Health Score identified my portfolio was dangerously underdiversified. Rebalanced within a week. Best financial tool I've used.",
    name: "Deepa Krishnan",
    role: "Quantitative Analyst",
    company: "GIC Private",
    city: "Singapore",
    country: "SG",
    lat: 1.3521,
    lng: 103.8198,
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    tone: 4,
  },
  {
    id: "dubai",
    quote: "I compared Old vs New tax regimes side-by-side before returning to India. Saved my family ₹35,000 in unnecessary taxes.",
    name: "Ananya Deshmukh",
    role: "Finance Director",
    company: "Emaar Properties",
    city: "Dubai",
    country: "AE",
    lat: 25.2048,
    lng: 55.2708,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    tone: 5,
  },
  {
    id: "new-york",
    quote: "The clarity on equity vs debt allocation for Indian mutual funds while living abroad gave me complete peace of mind.",
    name: "Karthik Ramanathan",
    role: "Portfolio Manager",
    company: "Morgan Stanley",
    city: "New York",
    country: "US",
    lat: 40.7128,
    lng: -74.006,
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    tone: 1,
  },
  {
    id: "toronto",
    quote: "Planning my return to India in 3 years. The FIRE calculator helped me set exact SIP targets to hit my corpus goal.",
    name: "Meera Iyer",
    role: "Data Engineer",
    company: "Shopify",
    city: "Toronto",
    country: "CA",
    lat: 43.6532,
    lng: -79.3832,
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    tone: 2,
  },
  {
    id: "sydney",
    quote: "An AI that actually understands PPF lock-ins, ELSS, and NPS limits. Incredibly useful for the Indian diaspora worldwide.",
    name: "Vikram Nair",
    role: "Senior Consultant",
    company: "Deloitte Australia",
    city: "Sydney",
    country: "AU",
    lat: -33.8688,
    lng: 151.2093,
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    tone: 3,
  },
  {
    id: "delhi",
    quote: "The Money Health Score identified that my term insurance was severely underfunded and my emergency fund was parked inefficiently.",
    name: "Rohan Malhotra",
    role: "Management Consultant",
    company: "Apex Advisory",
    city: "New Delhi",
    country: "IN",
    lat: 28.6139,
    lng: 77.209,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    tone: 4,
  },
  {
    id: "frankfurt",
    quote: "Tax planning as an NRI in Germany was a nightmare. MoneyMentor simplified it massively — especially the regime comparison.",
    name: "Siddharth Rao",
    role: "Research Scientist",
    company: "SAP SE",
    city: "Frankfurt",
    country: "DE",
    lat: 50.1109,
    lng: 8.6821,
    image: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80",
    rating: 5,
    tone: 5,
  },
];

const USER_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80"
];

const CITY_COORDINATES = {
  // ── India: Metros ──
  "Mumbai": { lat: 19.076, lng: 72.8777 },
  "Bengaluru": { lat: 12.9716, lng: 77.5946 },
  "Bangalore": { lat: 12.9716, lng: 77.5946 },
  "Delhi": { lat: 28.6139, lng: 77.209 },
  "New Delhi": { lat: 28.6139, lng: 77.209 },
  "Hyderabad": { lat: 17.385, lng: 78.4867 },
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Jaipur": { lat: 26.9124, lng: 75.7873 },
  "Surat": { lat: 21.1702, lng: 72.8311 },
  "Lucknow": { lat: 26.8467, lng: 80.9462 },
  "Nagpur": { lat: 21.1458, lng: 79.0882 },
  "Indore": { lat: 22.7196, lng: 75.8577 },
  "Thane": { lat: 19.2183, lng: 72.9781 },
  "Bhopal": { lat: 23.2599, lng: 77.4126 },
  "Visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  "Vizag": { lat: 17.6868, lng: 83.2185 },
  "Patna": { lat: 25.5941, lng: 85.1376 },
  "Vadodara": { lat: 22.3072, lng: 73.1812 },
  "Chandigarh": { lat: 30.7333, lng: 76.7794 },
  "Kochi": { lat: 9.9312, lng: 76.2673 },
  "Coimbatore": { lat: 11.0168, lng: 76.9558 },
  "Noida": { lat: 28.5355, lng: 77.3910 },
  "Gurugram": { lat: 28.4595, lng: 77.0266 },
  "Gurgaon": { lat: 28.4595, lng: 77.0266 },
  "Mysore": { lat: 12.2958, lng: 76.6394 },
  "Mysuru": { lat: 12.2958, lng: 76.6394 },
  "Mangalore": { lat: 12.9141, lng: 74.8560 },
  "Nashik": { lat: 19.9975, lng: 73.7898 },
  "Bhubaneswar": { lat: 20.2961, lng: 85.8245 },
  "Dehradun": { lat: 30.3165, lng: 78.0322 },
  "Goa": { lat: 15.2993, lng: 74.1240 },
  "Srinagar": { lat: 34.0837, lng: 74.7973 },
  "Guwahati": { lat: 26.1445, lng: 91.7362 },
  "Thiruvananthapuram": { lat: 8.5241, lng: 76.9366 },
  "Trivandrum": { lat: 8.5241, lng: 76.9366 },
  "India": { lat: 20.5937, lng: 78.9629 },
  // ── Global: NRI hubs & major financial cities ──
  "London": { lat: 51.5074, lng: -0.1278 },
  "New York": { lat: 40.7128, lng: -74.006 },
  "San Francisco": { lat: 37.7749, lng: -122.4194 },
  "Seattle": { lat: 47.6062, lng: -122.3321 },
  "Chicago": { lat: 41.8781, lng: -87.6298 },
  "Boston": { lat: 42.3601, lng: -71.0589 },
  "Los Angeles": { lat: 34.0522, lng: -118.2437 },
  "Washington": { lat: 38.9072, lng: -77.0369 },
  "Toronto": { lat: 43.6532, lng: -79.3832 },
  "Vancouver": { lat: 49.2827, lng: -123.1207 },
  "Dubai": { lat: 25.2048, lng: 55.2708 },
  "Abu Dhabi": { lat: 24.4539, lng: 54.3773 },
  "Singapore": { lat: 1.3521, lng: 103.8198 },
  "Sydney": { lat: -33.8688, lng: 151.2093 },
  "Melbourne": { lat: -37.8136, lng: 144.9631 },
  "Frankfurt": { lat: 50.1109, lng: 8.6821 },
  "Berlin": { lat: 52.52, lng: 13.405 },
  "Amsterdam": { lat: 52.3676, lng: 4.9041 },
  "Paris": { lat: 48.8566, lng: 2.3522 },
  "Zurich": { lat: 47.3769, lng: 8.5417 },
  "Tokyo": { lat: 35.6762, lng: 139.6503 },
  "Hong Kong": { lat: 22.3193, lng: 114.1694 },
  "Kuala Lumpur": { lat: 3.1390, lng: 101.6869 },
  "Riyadh": { lat: 24.7136, lng: 46.6753 },
  "Bahrain": { lat: 26.0667, lng: 50.5577 },
  "Muscat": { lat: 23.5880, lng: 58.3829 },
  "Johannesburg": { lat: -26.2041, lng: 28.0473 },
  "Nairobi": { lat: -1.2921, lng: 36.8219 },
};

// Resolve a city name to lat/lng.
// Tries: exact → case-insensitive → partial match → seeded scatter inside India.
function resolveCity(cityName, seed = 0) {
  if (!cityName) return { lat: 20.5937 + (seed % 5) * 0.7, lng: 78.9629 + (seed % 7) * 0.6 };

  // 1. Exact match
  if (CITY_COORDINATES[cityName]) return CITY_COORDINATES[cityName];

  // 2. Case-insensitive match
  const lower = cityName.toLowerCase().trim();
  const exactCI = Object.keys(CITY_COORDINATES).find(k => k.toLowerCase() === lower);
  if (exactCI) return CITY_COORDINATES[exactCI];

  // 3. Partial match (e.g. "Bang" → "Bangalore", "Navi" → "Navi Mumbai")
  const partial = Object.keys(CITY_COORDINATES).find(
    k => k.toLowerCase().startsWith(lower) || lower.startsWith(k.toLowerCase())
  );
  if (partial) return CITY_COORDINATES[partial];

  // 4. Seeded scatter across the whole globe so unknown cities don't pile up in India.
  //    Use a string hash so the same unknown city always lands on the same pin.
  let hash = 0;
  for (let i = 0; i < cityName.length; i++) hash = (hash * 31 + cityName.charCodeAt(i)) >>> 0;
  return {
    lat: -50 + (hash % 10000) / 10000 * 100,            // –50° to +50°
    lng: -170 + ((hash >>> 13) % 10000) / 10000 * 340,  // –170° to +170°
  };
}

export function TestimonialGlobeReviews({ autoplay = true }) {
  const { reviews } = useReview();

  // Combine user reviews submitted after tasks with the base reviews
  const items = React.useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return BASE_GLOBE_REVIEWS;
    }

    const dynamicReviews = reviews.map((r, index) => {
      const cityName = (r.city || '').trim() || 'India';
      const coords = resolveCity(cityName, index);

      return {
        id: `user-review-${r.id || index}`,
        quote: r.comment || "Great insights and quick actionable plan!",
        name: r.userName || "Verified Investor",
        role: r.type || "Financial Planner",
        company: "MoneyMentor User",
        city: cityName,
        country: r.country || "IN",
        lat: coords.lat,
        lng: coords.lng,
        image: r.avatar || USER_AVATARS[index % USER_AVATARS.length],
        rating: r.rating || 5,
        tone: (index % 5) + 1,
      };
    });

    // Put new user reviews right at the front so they immediately appear on the globe
    return [...dynamicReviews.reverse(), ...BASE_GLOBE_REVIEWS];
  }, [reviews]);

  return (
    <div className="w-full">
      <TestimonialGlobe
        items={items}
        eyebrow="Live Community Feedback"
        heading="Real Stories of Financial Freedom"
        caption="From tax optimization to retirement planning, see real-time reviews submitted by investors across India."
        autoplay={autoplay}
        interval={4000}
      />
    </div>
  );
}

export default TestimonialGlobeReviews;
