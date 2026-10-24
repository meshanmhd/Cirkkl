export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  category: string;
  organizer: string;
  seats: number;
  seatsAvailable: number;
  image: string;
  featured: boolean;
  tags: string[];
  price: "free" | "paid";
  priceAmount?: number;
  registered?: boolean;
}

export const CATEGORIES = [
  { name: "Workshops", icon: "🔧", color: "#FF6B35", bg: "#FFF3EE" },
  { name: "Hackathons", icon: "💻", color: "#7B61FF", bg: "#F3F0FF" },
  { name: "Cultural", icon: "🎭", color: "#FF3B7A", bg: "#FFF0F5" },
  { name: "Sports", icon: "⚽", color: "#34C759", bg: "#F0FFF4" },
  { name: "Technical", icon: "⚙️", color: "#007AFF", bg: "#EBF5FF" },
  { name: "Seminars", icon: "🎓", color: "#FF9500", bg: "#FFF8EE" },
  { name: "Competitions", icon: "🏆", color: "#AF52DE", bg: "#F8F0FF" },
  { name: "Music", icon: "🎵", color: "#FF2D55", bg: "#FFF0F3" },
];



export const STATS = [
  { value: "500+", label: "Events", description: "Across all categories" },
  { value: "50+", label: "Clubs", description: "Active student organizations" },
  { value: "10K+", label: "Students", description: "Engaged campus community" },
  { value: "95%", label: "Satisfaction", description: "Student participation rate" },
];
