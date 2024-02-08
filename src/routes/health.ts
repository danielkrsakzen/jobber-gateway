import { Health } from '@gateway/controllers/health';
import { Router } from 'express';

class HealthRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  public routes(): Router {
    this.router.get('/gateway-health', Health.prototype.health);

    return this.router;
  }
}

export const healthRoutes: HealthRoutes = new HealthRoutes();
