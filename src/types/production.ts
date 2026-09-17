export type ProductionState =
  | 'DRAFT'
  | 'PLAN_SUBMITTED'
  | 'PLAN_REJECTED'
  | 'QUOTA_ALLOCATED'
  | 'PRODUCING'
  | 'CONTENT_SUBMITTED'
  | 'CONTENT_REJECTED'
  | 'COMPLIANCE_PENDING'
  | 'PUBLISHED';

export type ProductionRole = 'reviewer' | 'creator';

export interface ScenePlan {
  sceneNumber: number;
  title: string;
  description: string;
  targetDurationSec: number;
  estimatedTokens: number;
  visualPrompt: string;
  audioPrompt: string;
}

export interface FeedbackItem {
  id: string;
  author: string;
  role: ProductionRole;
  type: 'plan_changes' | 'content_changes' | 'approval';
  content: string;
  createdAt: string;
}

export interface ProductionPlan {
  id: string;
  projectId: string;
  episodeId: string;
  overviewScript: string;
  totalScenes: number;
  targetDuration: string;
  estimatedTokens: number;
  storyboardSummary: string;
  sceneBreakdown: ScenePlan[];
  submittedAt?: string;
  feedbackHistory: FeedbackItem[];
}

export type SceneRenderStatus = 'idle' | 'rendering' | 'completed' | 'error';

export interface UserDevice {
  id: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'tv';
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrentDevice: boolean;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  assignedTo: string;
  deliverable: string;
}

export interface AIPolicy {
  id: string;
  code: string;
  name: string;
  version: string;
  description: string;
  minModerationScore: number;
  watermarkRequired: boolean;
  disclaimerText: string;
  allowedModels: string[];
}

export interface EpisodeSubmission {
  id: string;
  episodeId: string;
  projectId: string;
  submittedAt: string;
  submittedBy: string;
  versionNumber: string;
  totalScenes: number;
  totalDurationSec: number;
  totalTokensSpent: number;
  videoDraftUrl: string;
  changeSummary: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface TokenExtensionRequest {
  id: string;
  projectId: string;
  episodeId: string;
  episodeTitle: string;
  requestedTokens: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerNotes?: string;
  reviewedAt?: string;
}

export type SceneReviewStatus = 'pending' | 'approved' | 'changes_requested';

export interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  prompt: string;
  dialogue: string;
  voiceModel: string;
  videoModel: string;
  status: SceneRenderStatus;
  progress: number;
  durationSec: number;
  tokenCost: number;
  videoUrl: string;
  thumbnailUrl: string;
  reviewStatus?: SceneReviewStatus;
  reviewFeedback?: string;
  reviewedAt?: string;
}

export interface QuotaAllocation {
  allocatedTokens: number;
  allocatedAt: string;
  allocatedBy: string;
  notes?: string;
}

export interface ComplianceMetadata {
  aiLawArticle44Verified: boolean;
  decree142LabelAttached: boolean;
  aiWatermarkEnabled: boolean;
  certificationId: string;
  moderationScore: number;
  aiContentPercentage: number;
  verifiedBy: string;
  verifiedAt: string;
}

export interface ProductionEpisode {
  id: string;
  projectId: string;
  episodeNumber: number;
  title: string;
  status: ProductionState;
  plan: ProductionPlan;
  quota: QuotaAllocation | null;
  scenes: Scene[];
  totalDuration: string;
  maxDurationSec?: number;
  actualTokensUsed: number;
  videoDraftUrl: string;
  compliance: ComplianceMetadata | null;
  scheduledReleaseDate: string | null;
  milestoneId?: string;
  submissions?: EpisodeSubmission[];
  tokenExtensionRequests?: TokenExtensionRequest[];
  draftsCount?: number;
  assigneeName?: string;
}

export interface Project {
  id: string;
  title: string;
  genre: string[] | string;
  synopsis: string;
  totalEpisodes: number;
  episodes: ProductionEpisode[];
  deadline: string;
  plannedReleaseDate: string;
  totalBudgetTokens: number;
  allocatedTokens: number;
  consumedTokens: number;
  status: 'planning' | 'in_production' | 'completed';
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  reviewerName: string;
  milestones?: ProjectMilestone[];
  appliedPolicy?: AIPolicy;
  tokenExtensionRequests?: TokenExtensionRequest[];
}
