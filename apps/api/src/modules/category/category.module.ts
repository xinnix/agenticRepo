import { Module } from '@nestjs/common';
import { CategoryController } from './rest/category.controller';
import { CategoryService } from './services/category.service';

/**
 * Category 模块
 * 负责工单分类管理
 */
@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
