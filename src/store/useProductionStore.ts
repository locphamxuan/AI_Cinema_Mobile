import { create } from 'zustand';
import {
  Project,
  ProductionEpisode,
  ProductionPlan,
  Scene,
  ProductionRole,
  ComplianceMetadata,
  FeedbackItem,
  UserDevice,
  ProjectMilestone,
  AIPolicy,
  EpisodeSubmission,
  TokenExtensionRequest,
  SceneReviewStatus,
} from '../types/production';
import { mockProjectCyber, mockUserDevices } from '../mocks/productionMock';
import { productionService } from '../services';
import { adaptApiProjectToProject } from '../lib/apiAdapter';

interface ProductionStoreState {
  projects: Project[];
  activeProjectId: string;
  activeRole: ProductionRole;
  isLoadingProjects: boolean;
  loadProjects: () => Promise<void>;

  // Global Actions
  setActiveRole: (role: ProductionRole) => void;
  setActiveProject: (projectId: string) => void;
  getProject: (projectId?: string) => Project | undefined;
  getEpisode: (episodeId: string, projectId?: string) => ProductionEpisode | undefined;

  // Reviewer Actions
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'allocatedTokens' | 'consumedTokens' | 'status'>) => Project;
  requestPlanChanges: (projectId: string, episodeId: string, feedbackContent: string) => boolean;
  approveAndAllocateQuota: (projectId: string, episodeId: string, tokenQuota: number, notes?: string) => boolean;
  requestContentChanges: (projectId: string, episodeId: string, feedbackContent: string) => boolean;
  approveContent: (projectId: string, episodeId: string) => boolean;
  verifyComplianceAndPublish: (
    projectId: string,
    episodeId: string,
    complianceData: ComplianceMetadata,
    scheduledReleaseDate?: string
  ) => boolean;

  // Creator Actions
  submitProductionPlan: (projectId: string, episodeId: string, planData: Partial<ProductionPlan>) => boolean;
  updateScene: (projectId: string, episodeId: string, sceneId: string, sceneUpdates: Partial<Scene>) => void;
  addScene: (projectId: string, episodeId: string, newScene: Omit<Scene, 'id' | 'status' | 'progress' | 'videoUrl'>) => void;
  removeScene: (projectId: string, episodeId: string, sceneId: string) => void;
  generateSceneVideo: (projectId: string, episodeId: string, sceneId: string) => Promise<{ success: boolean; error?: string }>;
  submitEpisodeForReview: (projectId: string, episodeId: string) => { success: boolean; error?: string };

  // Devices Management
  devices: UserDevice[];
  revokeDevice: (deviceId: string) => void;
  revokeAllOtherDevices: () => void;

  // Milestones Management
  addMilestone: (projectId: string, milestone: Omit<ProjectMilestone, 'id'>) => void;
  updateMilestone: (projectId: string, milestoneId: string, updates: Partial<ProjectMilestone>) => void;
  removeMilestone: (projectId: string, milestoneId: string) => void;

  // AI Policy
  setProjectPolicy: (projectId: string, policy: AIPolicy) => void;

  // Reorder & Review Scenes
  reorderScenes: (projectId: string, episodeId: string, fromIndex: number, toIndex: number) => void;
  reviewScene: (projectId: string, episodeId: string, sceneId: string, status: SceneReviewStatus, feedback?: string) => void;

  // Token Extension Requests
  requestTokenExtension: (projectId: string, episodeId: string, requestedTokens: number, reason: string) => void;
  respondToTokenExtension: (projectId: string, requestId: string, approve: boolean, notes?: string) => void;

  // Submission Management
  submitEpisodeDraft: (projectId: string, episodeId: string, changeSummary: string) => { success: boolean; submission?: EpisodeSubmission; error?: string };
}

export const useProductionStore = create<ProductionStoreState>((set, get) => ({
  projects: [mockProjectCyber],
  activeProjectId: 'proj-cyber-01',
  activeRole: 'reviewer',
  isLoadingProjects: false,

  loadProjects: async () => {
    try {
      set({ isLoadingProjects: true });
      const res = await productionService.listProjects();
      if (res.success && res.data) {
        const raw = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
        if (raw.length > 0) {
          const adapted = raw.map(adaptApiProjectToProject);
          set({
            projects: adapted,
            activeProjectId: adapted[0]?.id || get().activeProjectId,
            isLoadingProjects: false,
          });
          return;
        }
      }
      set({ isLoadingProjects: false });
    } catch (e) {
      console.warn('loadProjects fallback:', e);
      set({ isLoadingProjects: false });
    }
  },

  setActiveRole: (role) => set({ activeRole: role }),
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),

  getProject: (projectId) => {
    const pId = projectId || get().activeProjectId;
    return get().projects.find((p) => p.id === pId) || get().projects[0];
  },

  getEpisode: (episodeId, projectId) => {
    const proj = get().getProject(projectId);
    return proj?.episodes.find((e) => e.id === episodeId);
  },

  createProject: (projectData) => {
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      allocatedTokens: 0,
      consumedTokens: 0,
      status: 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: [newProject, ...state.projects],
      activeProjectId: newProject.id,
    }));

    return newProject;
  },

  requestPlanChanges: (projectId, episodeId, feedbackContent) => {
    const feedback: FeedbackItem = {
      id: `fb-${Date.now()}`,
      author: 'Lê Quốc Bảo (Reviewer)',
      role: 'reviewer',
      type: 'plan_changes',
      content: feedbackContent,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          updatedAt: new Date().toISOString(),
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return {
              ...ep,
              status: 'PLAN_REJECTED',
              plan: {
                ...ep.plan,
                feedbackHistory: [feedback, ...ep.plan.feedbackHistory],
              },
            };
          }),
        };
      }),
    }));

    return true;
  },

  approveAndAllocateQuota: (projectId, episodeId, tokenQuota, notes) => {
    productionService.allocateQuota(projectId, episodeId, tokenQuota, notes).catch((e) => {
      console.warn('productionService.allocateQuota fallback:', e);
    });

    const feedback: FeedbackItem = {
      id: `fb-${Date.now()}`,
      author: 'Lê Quốc Bảo (Reviewer)',
      role: 'reviewer',
      type: 'approval',
      content: `Kế hoạch được phê duyệt. Đã cấp hạn ngạch ${tokenQuota} AI Tokens. ${notes || ''}`,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        const newAllocatedTokens = proj.allocatedTokens + tokenQuota;
        return {
          ...proj,
          allocatedTokens: newAllocatedTokens,
          status: 'in_production',
          updatedAt: new Date().toISOString(),
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return {
              ...ep,
              status: 'QUOTA_ALLOCATED',
              quota: {
                allocatedTokens: tokenQuota,
                allocatedAt: new Date().toISOString(),
                allocatedBy: 'Lê Quốc Bảo (Reviewer)',
                notes: notes || 'Hạn ngạch được cấp chính thức',
              },
              plan: {
                ...ep.plan,
                feedbackHistory: [feedback, ...ep.plan.feedbackHistory],
              },
            };
          }),
        };
      }),
    }));

    return true;
  },

  requestContentChanges: (projectId, episodeId, feedbackContent) => {
    const feedback: FeedbackItem = {
      id: `fb-${Date.now()}`,
      author: 'Lê Quốc Bảo (Reviewer)',
      role: 'reviewer',
      type: 'content_changes',
      content: feedbackContent,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          updatedAt: new Date().toISOString(),
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return {
              ...ep,
              status: 'CONTENT_REJECTED',
              plan: {
                ...ep.plan,
                feedbackHistory: [feedback, ...ep.plan.feedbackHistory],
              },
            };
          }),
        };
      }),
    }));

    return true;
  },

  approveContent: (projectId, episodeId) => {
    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          updatedAt: new Date().toISOString(),
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return {
              ...ep,
              status: 'COMPLIANCE_PENDING',
            };
          }),
        };
      }),
    }));

    return true;
  },

  verifyComplianceAndPublish: (projectId, episodeId, complianceData, scheduledReleaseDate) => {
    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          updatedAt: new Date().toISOString(),
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return {
              ...ep,
              status: 'PUBLISHED',
              compliance: complianceData,
              scheduledReleaseDate: scheduledReleaseDate || new Date().toISOString(),
            };
          }),
        };
      }),
    }));

    return true;
  },

  submitProductionPlan: (projectId, episodeId, planData) => {
    const feedback: FeedbackItem = {
      id: `fb-${Date.now()}`,
      author: 'Trần Minh Huy (Creator)',
      role: 'creator',
      type: 'approval',
      content: 'Đã hoàn thiện và gửi kế hoạch sản xuất lên Reviewer phê duyệt.',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          updatedAt: new Date().toISOString(),
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return {
              ...ep,
              status: 'PLAN_SUBMITTED',
              plan: {
                ...ep.plan,
                ...planData,
                submittedAt: new Date().toISOString(),
                feedbackHistory: [feedback, ...ep.plan.feedbackHistory],
              },
            };
          }),
        };
      }),
    }));

    return true;
  },

  updateScene: (projectId, episodeId, sceneId, sceneUpdates) => {
    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return {
              ...ep,
              scenes: ep.scenes.map((sc) => (sc.id === sceneId ? { ...sc, ...sceneUpdates } : sc)),
            };
          }),
        };
      }),
    }));
  },

  addScene: (projectId, episodeId, newScene) => {
    const scene: Scene = {
      ...newScene,
      id: `sc-${Date.now()}`,
      status: 'idle',
      progress: 0,
      videoUrl: '',
    };

    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return {
              ...ep,
              scenes: [...ep.scenes, scene],
            };
          }),
        };
      }),
    }));
  },

  removeScene: (projectId, episodeId, sceneId) => {
    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return {
              ...ep,
              scenes: ep.scenes.filter((sc) => sc.id !== sceneId),
            };
          }),
        };
      }),
    }));
  },

  generateSceneVideo: async (projectId, episodeId, sceneId) => {
    const ep = get().getEpisode(episodeId, projectId);
    if (!ep) return { success: false, error: 'Không tìm thấy tập phim' };

    const scene = ep.scenes.find((s) => s.id === sceneId);
    if (!scene) return { success: false, error: 'Không tìm thấy phân cảnh' };

    const quota = ep.quota?.allocatedTokens || 0;
    const currentUsed = ep.actualTokensUsed;
    const needed = scene.tokenCost;

    if (currentUsed + needed > quota) {
      return {
        success: false,
        error: `Vượt quá giới hạn Token Quota! (${currentUsed}/${quota} Tokens, Cần: ${needed}).`,
      };
    }

    get().updateScene(projectId, episodeId, sceneId, { status: 'rendering', progress: 20 });
    
    // Call backend generation service
    productionService.generateSceneVideo(projectId, episodeId, sceneId).catch((e) => {
      console.warn('productionService.generateSceneVideo fallback:', e);
    });

    await new Promise((r) => setTimeout(r, 400));
    get().updateScene(projectId, episodeId, sceneId, { progress: 65 });
    await new Promise((r) => setTimeout(r, 400));
    get().updateScene(projectId, episodeId, sceneId, {
      status: 'completed',
      progress: 100,
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    });

    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          consumedTokens: proj.consumedTokens + needed,
          episodes: proj.episodes.map((e) => {
            if (e.id !== episodeId) return e;
            return {
              ...e,
              status: 'PRODUCING',
              actualTokensUsed: e.actualTokensUsed + needed,
            };
          }),
        };
      }),
    }));

    return { success: true };
  },

  submitEpisodeForReview: (projectId, episodeId) => {
    const ep = get().getEpisode(episodeId, projectId);
    if (!ep) return { success: false, error: 'Không tìm thấy tập phim' };

    const uncompleted = ep.scenes.filter((s) => s.status !== 'completed');
    if (uncompleted.length > 0) {
      return {
        success: false,
        error: `Còn ${uncompleted.length} phân cảnh chưa hoàn tất render AI.`,
      };
    }

    const feedback: FeedbackItem = {
      id: `fb-${Date.now()}`,
      author: 'Trần Minh Huy (Creator)',
      role: 'creator',
      type: 'approval',
      content: `Đã render thành công ${ep.scenes.length} phân cảnh và nộp bản video draft lên Reviewer.`,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          updatedAt: new Date().toISOString(),
          episodes: proj.episodes.map((e) => {
            if (e.id !== episodeId) return e;
            return {
              ...e,
              status: 'CONTENT_SUBMITTED',
              videoDraftUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              plan: {
                ...e.plan,
                feedbackHistory: [feedback, ...e.plan.feedbackHistory],
              },
            };
          }),
        };
      }),
    }));

    return { success: true };
  },

  // ===== DEVICES MANAGEMENT =====
  devices: mockUserDevices,

  revokeDevice: (deviceId) => {
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== deviceId),
    }));
  },

  revokeAllOtherDevices: () => {
    set((state) => ({
      devices: state.devices.filter((d) => d.isCurrentDevice),
    }));
  },

  // ===== MILESTONES MANAGEMENT =====
  addMilestone: (projectId, milestoneData) => {
    const newMilestone: ProjectMilestone = {
      ...milestoneData,
      id: `ms-${Date.now()}`,
    };
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: [...(p.milestones || []), newMilestone],
        };
      }),
    }));
  },

  updateMilestone: (projectId, milestoneId, updates) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: (p.milestones || []).map((m) =>
            m.id === milestoneId ? { ...m, ...updates } : m
          ),
        };
      }),
    }));
  },

  removeMilestone: (projectId, milestoneId) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: (p.milestones || []).filter((m) => m.id !== milestoneId),
        };
      }),
    }));
  },

  // ===== AI POLICY =====
  setProjectPolicy: (projectId, policy) => {
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          appliedPolicy: policy,
        };
      }),
    }));
  },

  // ===== REORDER & REVIEW SCENES =====
  reorderScenes: (projectId, episodeId, fromIndex, toIndex) => {
    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            const updatedScenes = [...ep.scenes];
            const [moved] = updatedScenes.splice(fromIndex, 1);
            updatedScenes.splice(toIndex, 0, moved);
            // Re-index scene numbers
            const reIndexed = updatedScenes.map((s, idx) => ({
              ...s,
              sceneNumber: idx + 1,
            }));
            return {
              ...ep,
              scenes: reIndexed,
            };
          }),
        };
      }),
    }));
  },

  reviewScene: (projectId, episodeId, sceneId, status, feedback) => {
    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          episodes: proj.episodes.map((ep) => {
            if (ep.id !== episodeId) return ep;
            return {
              ...ep,
              scenes: ep.scenes.map((s) => {
                if (s.id !== sceneId) return s;
                return {
                  ...s,
                  reviewStatus: status,
                  reviewFeedback: feedback || s.reviewFeedback,
                  reviewedAt: new Date().toISOString(),
                };
              }),
            };
          }),
        };
      }),
    }));
  },

  // ===== TOKEN EXTENSION REQUESTS =====
  requestTokenExtension: (projectId, episodeId, requestedTokens, reason) => {
    const ep = get().getEpisode(episodeId, projectId);
    const newReq: TokenExtensionRequest = {
      id: `req-${Date.now()}`,
      projectId,
      episodeId,
      episodeTitle: ep?.title || 'Tập phim',
      requestedTokens,
      reason,
      requestedBy: 'Trần Minh Huy (Creator)',
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          tokenExtensionRequests: [newReq, ...(p.tokenExtensionRequests || [])],
        };
      }),
    }));
  },

  respondToTokenExtension: (projectId, requestId, approve, notes) => {
    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        const targetReq = (proj.tokenExtensionRequests || []).find((r) => r.id === requestId);
        const updatedRequests = (proj.tokenExtensionRequests || []).map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: approve ? ('approved' as const) : ('rejected' as const),
                reviewerNotes: notes,
                reviewedAt: new Date().toISOString(),
              }
            : r
        );

        let updatedEpisodes = proj.episodes;
        if (approve && targetReq) {
          updatedEpisodes = proj.episodes.map((ep) => {
            if (ep.id !== targetReq.episodeId) return ep;
            return {
              ...ep,
              quota: ep.quota
                ? {
                    ...ep.quota,
                    allocatedTokens: ep.quota.allocatedTokens + targetReq.requestedTokens,
                    notes: notes || 'Được duyệt bổ sung Token Quota theo đề xuất',
                  }
                : {
                    allocatedTokens: targetReq.requestedTokens,
                    allocatedAt: new Date().toISOString(),
                    allocatedBy: 'Lê Quốc Bảo (Reviewer)',
                    notes: notes || 'Cấp bổ sung Quota',
                  },
            };
          });
        }

        return {
          ...proj,
          tokenExtensionRequests: updatedRequests,
          episodes: updatedEpisodes,
        };
      }),
    }));
  },

  // ===== SUBMISSION MANAGEMENT =====
  submitEpisodeDraft: (projectId, episodeId, changeSummary) => {
    const ep = get().getEpisode(episodeId, projectId);
    if (!ep) return { success: false, error: 'Không tìm thấy tập phim' };

    const uncompleted = ep.scenes.filter((s) => s.status !== 'completed');
    if (uncompleted.length > 0) {
      return {
        success: false,
        error: `Còn ${uncompleted.length} phân cảnh chưa hoàn thành render.`,
      };
    }

    const nextVersionNum = `v1.${(ep.submissions?.length || 0) + 1}.0`;
    const totalDurationSec = ep.scenes.reduce((sum, s) => sum + s.durationSec, 0);

    const submission: EpisodeSubmission = {
      id: `sub-${Date.now()}`,
      episodeId,
      projectId,
      submittedAt: new Date().toISOString(),
      submittedBy: 'Trần Minh Huy (Creator)',
      versionNumber: nextVersionNum,
      totalScenes: ep.scenes.length,
      totalDurationSec,
      totalTokensSpent: ep.actualTokensUsed,
      videoDraftUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      changeSummary,
      reviewStatus: 'pending',
    };

    const feedback: FeedbackItem = {
      id: `fb-${Date.now()}`,
      author: 'Trần Minh Huy (Creator)',
      role: 'creator',
      type: 'approval',
      content: `[Bản Nộp ${nextVersionNum}]: ${changeSummary}`,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      projects: state.projects.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          updatedAt: new Date().toISOString(),
          episodes: proj.episodes.map((e) => {
            if (e.id !== episodeId) return e;
            return {
              ...e,
              status: 'CONTENT_SUBMITTED',
              videoDraftUrl: submission.videoDraftUrl,
              submissions: [submission, ...(e.submissions || [])],
              plan: {
                ...e.plan,
                feedbackHistory: [feedback, ...e.plan.feedbackHistory],
              },
            };
          }),
        };
      }),
    }));

    return { success: true, submission };
  },
}));
