import { create } from 'zustand';
import {
  Project,
  ProductionEpisode,
  ProductionPlan,
  Scene,
  ProductionRole,
  ComplianceMetadata,
  FeedbackItem,
} from '../types/production';
import { mockProjectCyber } from '../mocks/productionMock';

interface ProductionStoreState {
  projects: Project[];
  activeProjectId: string;
  activeRole: ProductionRole;

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
}

export const useProductionStore = create<ProductionStoreState>((set, get) => ({
  projects: [mockProjectCyber],
  activeProjectId: 'proj-cyber-01',
  activeRole: 'reviewer',

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
}));
