import { ILogbookRepository } from '@/domain/repositories/logbook.repository.interface';
import { LogbookEntity, StatusValidasiLogbook } from '@/domain/entities/logbook.entity';

export class ValidateLogbookUseCase {
  constructor(private logbookRepo: ILogbookRepository) {}

  async execute(id: bigint, status: StatusValidasiLogbook, note?: string): Promise<LogbookEntity> {
    return await this.logbookRepo.updateValidationStatus(id, status, note);
  }
}
