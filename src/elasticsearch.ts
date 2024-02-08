import { winstonLogger } from '@danielkrsakzen/jobber-shared';
import { Client } from '@elastic/elasticsearch';
import { ClusterHealthHealthResponseBody } from '@elastic/elasticsearch/lib/api/types';
import { Logger } from 'winston';

import { config } from './config';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'apiGatewayServerElasticSearch', 'debug');

class ElasticSearch {
  private esClient: Client;

  constructor() {
    this.esClient = new Client({
      node: `${config.ELASTIC_SEARCH_URL}`
    });
  }

  public async checkConnection(): Promise<void> {
    let isConnected = false;

    while (!isConnected) {
      log.info('GatewayService connecting to ElasticSearch');

      try {
        const health: ClusterHealthHealthResponseBody = await this.esClient.cluster.health({});

        log.info(`Gateway ElasticSearch health status - ${health}`);

        isConnected = true;
      } catch (error) {
        log.error('Connection to ElasticSearch failed. Retrying...');
        log.log('error', 'GatewayService checkConnection() method: ', error);
      }
    }
  }
}

export const elasticSearch: ElasticSearch = new ElasticSearch();
