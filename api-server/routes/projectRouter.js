const express = require('express');
const auth = require('../auth/auth');
const {particularproject} = require('../controller/projectController');

const projectRouter = express.Router();

projectRouter.get('/:projectId',auth,particularproject);
// projectRouter.get('/',auth,)



module.exports = projectRouter;
