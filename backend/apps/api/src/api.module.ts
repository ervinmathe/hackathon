import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ForumsController } from './forums/forums.controller';
import { ForumsService } from './forums/forums.service';
import { PostsController } from './posts/posts.controller';
import { PostsService } from './posts/posts.service';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    CommentsModule,
  ],
  controllers: [
    ApiController,
    AuthController,
    ForumsController,
    PostsController,
  ],
  providers: [
    ApiService,
    AuthService,
    ForumsService,
    PostsService,
  ],
})
export class ApiModule {}
