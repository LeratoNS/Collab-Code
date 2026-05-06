// Lerato Sibanda u22705504 P14

const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');

// Controllers
const authRoutes = require('./authRoutes');
const userController = require('../controllers/userController');
const friendController = require('../controllers/friendController');
const projectController = require('../controllers/projectController');
const activityController = require('../controllers/activityController');
const discussionController = require('../controllers/discussionController');
const searchController = require('../controllers/searchController');
const projectTypeController = require('../controllers/projectTypeController');
const adminController = require('../controllers/adminController');

// Auth routes (no auth required)
router.use('/auth', authRoutes);

// User routes (specific routes before dynamic routes)
router.get('/users', auth, userController.getAllUsers);
router.put('/users/profile', auth, projectController.upload.single('profileImage'), userController.updateProfile);
router.delete('/users/account', auth, userController.deleteAccount);
router.post('/users/request-verification', auth, userController.requestVerification);
router.post('/users/save-project', auth, userController.saveProject);
router.delete('/users/unsave-project/:projectId', auth, userController.unsaveProject);
router.get('/users/:userId/saved-projects', auth, userController.getSavedProjects);
router.get('/users/:id', auth, userController.getUserById); // Dynamic route last

// Friend routes
router.get('/friends/requests', auth, friendController.getFriendRequests);
router.post('/friends/send', auth, friendController.sendFriendRequest);
router.post('/friends/accept/:id', auth, friendController.acceptFriendRequest);
router.post('/friends/reject/:id', auth, friendController.rejectFriendRequest);
router.delete('/friends/unfriend/:id', auth, friendController.unfriend);

// Project routes (specific routes BEFORE dynamic :id route)
router.get('/projects/local', auth, projectController.getLocalProjects);
router.get('/projects/global', auth, projectController.getGlobalProjects);
router.get('/projects', auth, projectController.getAllProjects);
router.get('/projects/:id', auth, projectController.getProjectById);
router.post('/projects/create', auth, projectController.combinedUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'files', maxCount: 10 }
]), projectController.createProject);
router.put('/projects/:id/update', auth, projectController.upload.single('image'), projectController.updateProject);
router.delete('/projects/:id/delete', auth, projectController.deleteProject);
router.post('/projects/:id/checkout', auth, projectController.checkoutProject);
router.post('/projects/:id/checkin', auth, projectController.fileUpload.array('files', 10), projectController.checkinProject);
router.post('/projects/:id/members', auth, projectController.addMember);
router.delete('/projects/:id/members', auth, projectController.removeMember);
router.post('/projects/:id/transfer-ownership', auth, projectController.transferOwnership);
router.get('/projects/:id/files', auth, projectController.downloadProjectFiles);
router.get('/projects/:projectId/files/:fileId/download', auth, projectController.downloadFile);
router.get('/projects/:projectId/files/:fileId/view', auth, projectController.viewFile);

// File management routes (members can add, edit, delete)
router.post('/projects/:id/files/add', auth, projectController.fileUpload.array('files', 20), projectController.addFile);
router.put('/projects/:projectId/files/:fileId/edit', auth, projectController.fileUpload.single('file'), projectController.editFile);
router.delete('/projects/:projectId/files/:fileId', auth, projectController.deleteFile);
// Individual file checkout/checkin removed - now done at project level only

// Version history routes
router.post('/projects/:id/versions/create', auth, projectController.createVersion);
router.get('/projects/:id/versions', auth, projectController.getVersionHistory);
router.post('/projects/:projectId/versions/:versionId/rollback', auth, projectController.rollbackToVersion);

// Activity routes
router.get('/activities', auth, activityController.getAllActivities);
router.get('/activities/local', auth, activityController.getLocalActivities);
router.get('/activities/global', auth, activityController.getGlobalActivities);
router.get('/activities/project/:id', auth, activityController.getProjectActivities);

// Discussion routes
router.get('/discussions/:projectId', auth, discussionController.getDiscussions);
router.post('/discussions/:projectId/add', auth, discussionController.addDiscussion);
router.put('/discussions/:id', auth, discussionController.updateDiscussion);
router.delete('/discussions/:id', auth, discussionController.deleteDiscussion);

// Search routes
router.get('/search/users', auth, searchController.searchUsers);
router.get('/search/projects', auth, searchController.searchProjects);

// Autocomplete routes (faster, for dropdown suggestions)
router.get('/autocomplete/users', auth, searchController.autocompleteUsers);
router.get('/autocomplete/projects', auth, searchController.autocompleteProjects);

// Project type routes
router.get('/project-types', auth, projectTypeController.getProjectTypes);
router.post('/project-types/add', adminAuth, projectTypeController.addProjectType);

// Admin routes
router.get('/admin/users', adminAuth, adminController.getAllUsers);
router.put('/admin/users/:id', adminAuth, projectController.upload.single('profileImage'), adminController.updateUser);
router.delete('/admin/users/:id', adminAuth, adminController.deleteUser);
router.get('/admin/projects', adminAuth, adminController.getAllProjects);
router.put('/admin/projects/:id', adminAuth, projectController.upload.single('image'), adminController.updateProject);
router.delete('/admin/projects/:id', adminAuth, adminController.deleteProject);
router.get('/admin/activities', adminAuth, adminController.getAllActivities);
router.put('/admin/activities/:id', adminAuth, adminController.updateActivity);
router.delete('/admin/activities/:id', adminAuth, adminController.deleteActivity);
router.get('/admin/discussions', adminAuth, adminController.getAllDiscussions);
router.put('/admin/discussions/:id', adminAuth, adminController.updateDiscussion);
router.delete('/admin/discussions/:id', adminAuth, adminController.deleteDiscussion);
router.get('/admin/project-types', adminAuth, adminController.getAllProjectTypes);
router.post('/admin/project-types', adminAuth, adminController.addProjectType);
router.delete('/admin/project-types/:id', adminAuth, adminController.deleteProjectType);
router.get('/admin/verification-requests', adminAuth, adminController.getVerificationRequests);
router.post('/admin/verification-requests/:id/approve', adminAuth, adminController.approveVerification);
router.post('/admin/verification-requests/:id/deny', adminAuth, adminController.denyVerification);

module.exports = router;
