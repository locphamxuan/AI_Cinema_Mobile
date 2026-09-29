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
  TokenExtensionRequest,
  SceneReviewStatus,
} from '../types/production';
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
  requestContentChanges: (projectId: string, episodeId: string, feedbackContent: string) => Promise<boolean>;
  approveContent: (projectId: string, episodeId: string) => Promise<boolean>;
  verifyComplianceAndPublish: (
    projectId: string,
    episodeId: string,
    complianceData: Partial<ComplianceMetadata>,
    scheduledReleaseDate?: string
  ) => Promise<boolean>;

  // Creator Actions
  submitProductionPlan: (projectId: string, episodeId: string, planData: Partial<ProductionPlan>) => boolean;
  updateScene: (projectId: string, episodeId: string, sceneId: string, sceneUpdates: Partial<Scene>) => void;
  addScene: (projectId: string, episodeId: string, newScene: Omit<Scene, 'id' | 'status' | 'progress' | 'videoUrl'>) => void;
  removeScene: (projectId: string, episodeId: string, sceneId: string) => void;
  generateSceneVideo: (projectId: string, episodeId: string, sceneId: string) => Promise<{ success: boolean; error?: string }>;
  submitEpisodeForReview: (projectId: string, episodeId: string) => Promise<{ success: boolean; error?: string }>;

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
  reviewScene: (projectId: string, episodeId: string, sceneId: string, status: SceneReviewStatus, feedback?: string) => Promise<boolean>;

  // Token Extension Requests
  requestTokenExtension: (projectId: string, episodeId: string, requestedTokens: number, reason: string) => void;
  respondToTokenExtension: (projectId: string, requestId: string, approve: boolean, notes?: string) => void;

}

export const useProductionStore = create<ProductionStoreState>((set, get) => ({
  projects: [],
  activeProjectId: '',
  activeRole: 'reviewer',
  isLoadingProjects: false,

  loadProjects: async () => {
    try {
      set({ isLoadingProjects: true });
      const res = await productionService.listProjects();
      if (res.success && res.data) {
        const raw = Array.isArray(res.data) ? res.data : (res.data as any).items || [];
        const adapted = raw.map(adaptApiProjectToProject);
        set({
          projects: adapted,
          activeProjectId: adapted[0]?.id || '',
          isLoadingProjects: false,
        });
        return;
      }
      set({ projects: [], activeProjectId: '', isLoadingProjects: false });
    } catch (e) {
      set({ projects: [], activeProjectId: '', isLoadingProjects: false });
    }
  },

  setActiveRole: (role) => set({ activeRole: role }),
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),

  getProject: (projectId) => {
    const pId = projectId || get().activeProjectId;
    return get().projects.find((p) => p.id === pId);
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
    void productionService.allocateQuota(projectId, episodeId, tokenQuota, notes).then((response) => {
      if (response.success) return get().loadProjects();
    });

    return false;

  },

  requestContentChanges: async (projectId, episodeId, feedbackContent) => {
    const episode = get().getEpisode(episodeId, projectId);
    if (!episode) return false;
    const response = await productionService.reviewPlan(episode.plan.id || episodeId, 'rejected', feedbackContent);
    if (!response.success) return false;
    await get().loadProjects();
    return true;
  },

  approveContent: async (projectId, episodeId) => {
    const episode = get().getEpisode(episodeId, projectId);
    if (!episode) return false;
    const response = await productionService.reviewPlan(episode.plan.id || episodeId, 'approved');
    if (!response.success) return false;
    await get().loadProjects();
    return true;
  },

  verifyComplianceAndPublish: async (projectId, episodeId, complianceData) => {
    const episode = get().getEpisode(episodeId, projectId);
    if (!episode) return false;
    const response = await productionService.verifyCompliance(episodeId, complianceData);
    if (!response.success) return false;
    await get().loadProjects();
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

    const response = await productionService.generateSceneVideo(projectId, episodeId, sceneId);
    if (!response.success || !response.data) {
      return { success: false, error: response.message || 'Không thể gửi yêu cầu render' };
    }
    get().updateScene(projectId, episodeId, sceneId, {
      status: response.data.status,
      progress: response.data.progress,
      videoUrl: response.data.videoUrl,
    });

    if (response.data.status !== 'completed') return { success: true };

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

  submitEpisodeForReview: async (projectId, episodeId) => {
    const ep = get().getEpisode(episodeId, projectId);
    if (!ep) return { success: false, error: 'Không tìm thấy tập phim' };

    const uncompleted = ep.scenes.filter((s) => s.status !== 'completed');
    if (uncompleted.length > 0) {
      return {
        success: false,
        error: `Còn ${uncompleted.length} phân cảnh chưa hoàn tất render AI.`,
      };
    }

    const response = await productionService.submitEpisodeForReview(episodeId);
    if (!response.success) return { success: false, error: response.message || 'Không thể gửi bản dựng' };

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
              status: response.data?.status || 'CONTENT_SUBMITTED',
              videoDraftUrl: response.data?.videoDraftUrl || e.videoDraftUrl,
            };
          }),
        };
      }),
    }));

    return { success: true };
  },

  // ===== DEVICES MANAGEMENT =====
  devices: [],

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

  reviewScene: async (projectId, episodeId, sceneId, status, feedback) => {
    const response = await productionService.reviewScene(sceneId, status, feedback);
    if (!response.success) return false;
    await get().loadProjects();
    return true;
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

}));
