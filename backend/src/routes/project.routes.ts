import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Read routes - any authenticated user can read projects
// (project-level access control is handled inside the controller via getAccessibleProjectIds)
// This allows pages like Roster, Staff, Reports, Dashboard to load the project dropdown
// even if the user doesn't have the 'projects' management permission.
router.get('/', getAllProjects);
router.get('/:id', getProjectById);

// Mutation routes - admin only
router.post('/', requireAdmin, createProject);
router.put('/:id', requireAdmin, updateProject);
router.delete('/:id', requireAdmin, deleteProject);

export default router;
