import { Controller, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Health check controller to monitor application and database status
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Basic health check endpoint with MySQL connectivity test
   * GET /api/v1/health
   * @returns 200 OK with status information
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description:
      'Check the health status of the application and database connection',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'healthy',
          description: 'Overall health status',
        },
        timestamp: {
          type: 'string',
          example: '2025-12-31T10:00:00.000Z',
          description: 'ISO timestamp of health check',
        },
        database: {
          type: 'string',
          example: 'connected',
          description: 'Database connection status',
        },
        uptime: {
          type: 'number',
          example: 3600,
          description: 'Application uptime in seconds',
        },
      },
    },
  })
  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    database: string;
    uptime: number;
  }> {
    let databaseStatus = 'disconnected';

    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        // Test database connectivity with a simple query
        await this.dataSource.query('SELECT 1 as test');
        databaseStatus = 'connected';
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      databaseStatus = 'error';
    }

    return {
      status: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      uptime: process.uptime(),
    };
  }
}
