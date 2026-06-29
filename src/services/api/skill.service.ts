import { ApiService } from './index';
import { Skill, SkillCreate, SkillUpdate } from '../../types/skill';

const api = ApiService.getInstance().getApi();

export const skillService = {
    listSkills: (include_public: boolean = true) =>
        api.get<Skill[]>('/api/v1/skills/list', { params: { include_public } }),

    getSkill: (skillId: string) =>
        api.get<Skill>(`/api/v1/skills/${skillId}`),

    createSkill: (data: SkillCreate) =>
        api.post<Skill>('/api/v1/skills/create', data),

    updateSkill: (skillId: string, data: SkillUpdate) =>
        api.put<Skill>(`/api/v1/skills/${skillId}`, data),

    deleteSkill: (skillId: string) =>
        api.delete(`/api/v1/skills/${skillId}`),

    assignSkillToAgent: (skillId: string, agentId: number) =>
        api.post(`/api/v1/skills/${skillId}/agents/${agentId}`),

    removeSkillFromAgent: (skillId: string, agentId: number) =>
        api.delete(`/api/v1/skills/${skillId}/agents/${agentId}`),
};
