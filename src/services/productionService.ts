import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { mockProjectCyber } from '../mocks/productionMock';
import { adaptApiProjectToProject } from '../lib/apiAdapter';
import type { ApiResponse } from '../types/api';
import type { Project, Scene } from '../types/production';

class ProductionService {
  async listProjects(): Promise<ApiResponse<Project[]>> {
    return apiClient.get<Project[]>(
      API_ROUTES.PRODUCTION.PROJECTS,
      undefined,
      async () => [mockProjectCyber]
    ).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        return {
          ...res,
          data: res.data.map(adaptApiProjectToProject),
        };
      }
      return res;
    });
  }

  async getProject(projectId: string): Promise<ApiResponse<Project>> {
    return apiClient.get<Project>(
      API_ROUTES.PRODUCTION.PROJECT_DETAIL(projectId),
      undefined,
      async () => mockProjectCyber
    ).then((res) => {
      if (res.success && res.data) {
        return {
          ...res,
          data: adaptApiProjectToProject(res.data),
        };
      }
      return res;
    });
  }

  async allocateQuota(
    projectOrPlanId: string,
    episodeOrQuota: string | number,
    tokenQuotaOrNotes?: number | string,
    notes?: string
  ): Promise<ApiResponse<any>> {
    let planId = projectOrPlanId;
    let quota = typeof episodeOrQuota === 'number' ? episodeOrQuota : (tokenQuotaOrNotes as number) || 500;
    let actualNotes = typeof episodeOrQuota === 'number' ? (tokenQuotaOrNotes as string) : notes;

    if (typeof episodeOrQuota === 'string') {
      planId = episodeOrQuota;
    }

    return apiClient.post(
      API_ROUTES.PRODUCTION.QUOTA_ALLOCATIONS(planId),
      {
        allocationType: 'INITIAL',
        allocatedAmount: quota,
        allocatedById: '1deebe95-e8ca-49aa-bd4d-c44489f9964f',
        notes: actualNotes,
      },
      undefined,
      async () => ({ success: true, allocatedAmount: quota })
    );
  }

  async generateSceneVideo(
    projectOrPlanId: string,
    episodeOrSceneId: string,
    sceneId?: string
  ): Promise<ApiResponse<Partial<Scene>>> {
    const planId = sceneId ? episodeOrSceneId : projectOrPlanId;
    const actualSceneId = sceneId || episodeOrSceneId;

    return apiClient.post<Partial<Scene>>(
      API_ROUTES.PRODUCTION.GENERATION_JOBS(planId),
      {
        sceneId: actualSceneId,
        jobType: 'VIDEO_GENERATION',
      },
      undefined,
      async () => ({
        status: 'completed',
        progress: 100,
        videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      })
    );
  }
}

export const productionService = new ProductionService();
