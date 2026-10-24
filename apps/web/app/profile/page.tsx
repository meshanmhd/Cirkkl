import { redirect } from "next/navigation";
import { ProfilePage } from "@/components/ProfilePage";
import { api } from "@/lib/api";

export const metadata = {
  title: "My Profile — Cirkkl",
  description: "View and edit your Cirkkl profile.",
};

export default async function ProfileRoute() {
  let profileData;
  try {
    const res = await api.profile.get();
    profileData = res.profile;
  } catch {
    redirect("/login?redirectTo=/profile");
  }

  return (
    <div className="min-h-screen bg-[#F7F7F8]">
      <ProfilePage
        profile={{
          ...profileData,
          id: profileData.id,
          email: profileData.email,
          qr_id: profileData.cklId ?? null,
          full_name: profileData.fullName ?? null,
          college_name: profileData.college ?? null,
          department: profileData.branch ?? null,
          semester: profileData.academicYear ?? null,
          phone: profileData.phoneNumber ?? null,
          avatar_url: profileData.avatarUrl ?? null,
          linkedin: profileData.linkedinUrl ?? null,
          github: profileData.githubUrl ?? null,
          is_profile_completed: profileData.isProfileCompleted ?? false,
        }}
      />
    </div>
  );
}
