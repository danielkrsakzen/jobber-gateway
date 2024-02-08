import http from 'http';

import { CustomError, IErrorResponse, winstonLogger } from '@danielkrsakzen/jobber-shared';
import cookieSession from 'cookie-session';
import cors from 'cors';
import { Application, NextFunction, Request, Response, json, urlencoded } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { Logger } from 'winston';
import compression from 'compression';
import { StatusCodes } from 'http-status-codes';

import { config } from './config';
import { elasticSearch } from './elasticsearch';
import { appRoutes } from './routes';

const SERVER_PORT = 4000;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'apiGatewayServer', 'debug');

export class GatewayServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routeMiddleware(this.app);
    this.errorHandler(this.app);
    this.startServer(this.app);
    this.startElasticSearch();
  }

  private securityMiddleware(app: Application): void {
    app.set('trust proxy', 1);

    app.use(
      cookieSession({
        name: 'session',
        keys: [`${config.SECRET_KEY_ONE}`],
        secure: config.NODE_ENV !== 'development',
        maxAge: 1000 * 60 * 60 * 24 * 7
      })
    );

    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '200mb' }));
    app.use(urlencoded({ extended: true, limit: '200mb' }));
  }

  private routeMiddleware(app: Application): void {
    appRoutes(app);
  }

  private startElasticSearch(): void {
    elasticSearch.checkConnection();
  }

  private errorHandler(app: Application): void {
    app.use('*', (req: Request, res: Response, next: NextFunction) => {
      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

      log.log('error', `${fullUrl} endpoint does not exist`, '');

      res.status(StatusCodes.NOT_FOUND).json({
        message: 'The called endpoint does not exist'
      });

      next();
    });

    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction): void => {
      log.log('error', `GatewayService ${error.comingFrom}:`, '');

      if (error instanceof CustomError) {
        res.status(error.statusCode).json(error.serializeErrors());
      }

      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);

      this.startHttpServer(httpServer);
    } catch (error) {
      log.log('error', 'GatewayService startServer() method: ', error);
    }
  }
  private async startHttpServer(httpServer: http.Server): Promise<void> {
    try {
      log.info(`Gateway server has started with process id of ${process.pid}`);

      httpServer.listen(SERVER_PORT, () => {
        log.info(`Gateway server running on port ${SERVER_PORT}`);
      });
    } catch (error) {
      log.log('error', 'GatewayService startHttpServer() method: ', error);
    }
  }
}
