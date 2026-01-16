import { Module } from '@nestjs/common';
import { TestProductController } from './testproduct.controller';
import { TestProductService } from './testproduct.service';

@Module({
  controllers: [TestProductController],
  providers: [TestProductService],
  exports: [TestProductService],
})
export class TestProductModule {}
