import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'KNEX_CONNECTION',
      useFactory: (configService: ConfigService): Knex => {
        return knex({
          client: 'pg',
          connection: {
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: parseInt(configService.get<string>('DB_PORT', '5433'), 10),
            user: configService.get<string>('DB_USER', 'hackathon_user'),
            password: configService.get<string>('DB_PASSWORD', 'hackathon_password'),
            database: configService.get<string>('DB_NAME', 'hackathon_db'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['KNEX_CONNECTION'],
})
export class DatabaseModule {}
