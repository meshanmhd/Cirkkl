import { ProfileRepo } from "../ports/repositories";
import { StorageProvider } from "../ports/storage.provider";
import { CallerContext } from "./auth.service";
import { notFound } from "../errors";

export class ProfileService {
  constructor(
    private readonly profileRepo: ProfileRepo,
    private readonly storageProvider: StorageProvider
  ) {}

  async getProfile(caller: CallerContext): Promise<any> {
    const profile = await this.profileRepo.findByUserId(caller.userId);
    if (!profile) {
      throw notFound("Profile not found");
    }

    return {
      profile: {
        id: profile.userId,
        email: profile.email,
        role: caller.role,
        fullName: profile.fullName,
        cklId: profile.cklId,
        college: profile.college,
        branch: profile.branch,
        academicYear: profile.academicYear,
        phoneNumber: profile.phoneNumber,
        gender: profile.gender,
        avatarUrl: profile.avatarUrl,
        isProfileCompleted: profile.isProfileCompleted,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        bio: profile.bio,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt?.toISOString(),
      },
    };
  }

  async updateProfile(input: any, caller: CallerContext): Promise<any> {
    const updated = await this.profileRepo.update(caller.userId, {
      fullName: input.fullName,
      college: input.college,
      branch: input.branch,
      academicYear: input.academicYear,
      phoneNumber: input.phoneNumber,
      gender: input.gender,
      linkedinUrl: input.linkedinUrl,
      githubUrl: input.githubUrl,
      bio: input.bio,
      isProfileCompleted: true,
    });

    return {
      profile: {
        id: updated.userId,
        email: updated.email,
        role: caller.role,
        fullName: updated.fullName,
        cklId: updated.cklId,
        college: updated.college,
        branch: updated.branch,
        academicYear: updated.academicYear,
        phoneNumber: updated.phoneNumber,
        gender: updated.gender,
        avatarUrl: updated.avatarUrl,
        isProfileCompleted: updated.isProfileCompleted,
        linkedinUrl: updated.linkedinUrl,
        githubUrl: updated.githubUrl,
        bio: updated.bio,
      },
    };
  }

  async updateAvatar(avatarKey: string, caller: CallerContext): Promise<{ avatarUrl: string }> {
    const avatarUrl = await this.storageProvider.getPublicUrl(avatarKey);
    await this.profileRepo.updateAvatar(caller.userId, avatarUrl);
    return { avatarUrl };
  }

  async searchColleges(query: string, limit?: number): Promise<{ colleges: any[] }> {
    const colleges = await this.profileRepo.searchColleges(query, limit);
    return { colleges };
  }
}
