import { Module } from '@nestjs/common';
import { TestTodoController } from './testtodo.controller';
import { TestTodoService } from './testtodo.service';

@Module({
  controllers: [TestTodoController],
  providers: [TestTodoService],
  exports: [TestTodoService],
})
export class TestTodoModule {}
