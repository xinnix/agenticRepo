import { Module } from '@nestjs/common';
import { TodoController } from './rest/todo.controller';
import { TodoService } from './services/todo.service';

@Module({
  controllers: [TodoController],
  providers: [TodoService],
  exports: [TodoService],
})
export class TodoModule {}
