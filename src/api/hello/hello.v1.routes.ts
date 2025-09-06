
// src/api/hello/hello.v1.routes.ts

import { Router } from 'express';
import { getHelloWorld } from './hello.v1.controller';

const router = Router();

// Simple GET endpoint that returns Hello World
// I maps the root path of the endpoint to the getHelloWorld controller function

router.get('/', getHelloWorld);

export default router;