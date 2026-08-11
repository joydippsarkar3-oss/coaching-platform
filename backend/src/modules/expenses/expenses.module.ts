import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [ExpensesController, InventoryController],
  providers: [ExpensesService, InventoryService],
  exports: [ExpensesService, InventoryService],
})
export class ExpensesModule {}
