import { apiClient } from './apiClient';
import { API_ROUTES } from '../constants/apiRoutes';
import { adaptApiProjectToProject } from '../lib/apiAdapter';
import type { ApiResponse } from '../types/api';
import type { ComplianceMetadata, ProductionEpisode, Project, Scene } from '../types/production';
import type { SceneReviewStatus } from '../types/production';

class ProductionService {
  async listProjects(): Promise<ApiResponse<Project[]>> {
    return apiClient.get<Project[]>(API_ROUTES.PRODUCTION.PROJECTS).then((res) => {
      if (res.success && res.data) {
        const rawList = Array.isArray(res.data)
          ? res.data
          : (res.data as any)?.data || (res.data as any)?.items || [];
        if (Array.isArray(rawList)) {
          return {
            ...res,
            data: rawList.map(adaptApiProjectToProject),
          };
        }
      }
      return res;
    });
  }

  async getProject(projectId: string): Promise<ApiResponse<Project>> {
    return apiClient.get<Project>(API_ROUTES.PRODUCTION.PROJECT_DETAIL(projectId)).then((res) => {
      if (res.success && res.data) {
        return {
          ...res,
          data: adaptApiProjectToProject(res.data),
        };
      }
      return res;
    });
  }

  async submitEpisodeForReview(planId: string): Promise<ApiResponse<Partial<ProductionEpisode>>> {
    return apiClient.post<Partial<ProductionEpisode>>(API_ROUTES.PRODUCTION.PLAN_SUBMIT(planId), {});
  }

  async verifyCompliance(packageId: string, checks: Partial<ComplianceMetadata>): Promise<ApiResponse<unknown>> {
    return apiClient.post(API_ROUTES.PRODUCTION.COMPLIANCE_CHECKS(packageId), checks);
  }

  async reviewPlan(planId: string, status: string, feedback?: string): Promise<ApiResponse<unknown>> {
    return apiClient.post(API_ROUTES.PRODUCTION.PLAN_REVIEWS(planId), { status, feedback });
  }

  async reviewScene(sceneId: string, status: SceneReviewStatus, feedback?: string): Promise<ApiResponse<unknown>> {
    return apiClient.patch(API_ROUTES.PRODUCTION.SCENE_DETAIL(sceneId), { reviewStatus: status, reviewFeedback: feedback });
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
      }
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
      }
    );
  }
}

export const productionService = new ProductionService();
