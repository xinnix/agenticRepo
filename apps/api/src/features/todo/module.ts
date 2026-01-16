import { Module } from '@nestjs/common';
import { TodoController } from './rest/todo.controller';
import { TodoService } from './services/todo.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [TodoController],
  providers: [TodoService, PrismaService],
  exports: [TodoService],
})
export class TodoModule {}
