import { Module } from '@nestjs/common';
import { SkillTodoController } from './skilltodo.controller';
import { SkillTodoService } from './skilltodo.service';

@Module({
  controllers: [SkillTodoController],
  providers: [SkillTodoService],
  exports: [SkillTodoService],
})
export class SkillTodoModule {}
