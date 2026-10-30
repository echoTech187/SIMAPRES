/**
 * SIMAPRES 110 - USE CASE FACTORY & DEPENDENCY INVERSION CONTAINER
 * Lapisan: Application (Central Inversion of Control / DI Factory)
 * Memastikan Controller / Delivery Mechanism hanya bergantung pada Interface Domain,
 * bukan implementasi konkrit infrastruktur.
 */

import { IComplaintRepository } from '@/domain/repositories/complaint.repository.interface';
import { IOfficerRepository } from '@/domain/repositories/officer.repository.interface';
import { ILogbookRepository } from '@/domain/repositories/logbook.repository.interface';
import { IHotspotRepository } from '@/domain/repositories/hotspot.repository.interface';
import { IUserRepository } from '@/domain/repositories/user.repository.interface';
import { IPiketRepository } from '@/domain/repositories/piket.repository.interface';
import { IMasterRepository } from '@/domain/repositories/master.repository.interface';
import { IDeviceRepository } from '@/domain/repositories/device.repository.interface';
import { IKnowledgeRepository } from '@/domain/repositories/knowledge.repository.interface';
import { IChatRepository } from '@/domain/repositories/chat.repository.interface';

import { PrismaComplaintRepository } from '@/infrastructure/repositories/prisma-complaint.repository';
import { PrismaOfficerRepository } from '@/infrastructure/repositories/prisma-officer.repository';
import { PrismaLogbookRepository } from '@/infrastructure/repositories/prisma-logbook.repository';
import { PrismaHotspotRepository } from '@/infrastructure/repositories/prisma-hotspot.repository';
import { PrismaUserRepository } from '@/infrastructure/repositories/prisma-user.repository';
import { PrismaPiketRepository } from '@/infrastructure/repositories/prisma-piket.repository';
import { PrismaMasterRepository } from '@/infrastructure/repositories/prisma-master.repository';
import { PrismaDeviceRepository } from '@/infrastructure/repositories/prisma-device.repository';
import { PrismaKnowledgeRepository } from '@/infrastructure/repositories/prisma-knowledge.repository';
import { PrismaChatRepository } from '@/infrastructure/repositories/prisma-chat.repository';

import { CreateComplaintUseCase } from '../use-cases/complaints/create-complaint.use-case';
import { DispatchComplaintUseCase } from '../use-cases/complaints/dispatch-complaint.use-case';
import { FieldStepActionUseCase } from '../use-cases/complaints/field-step-action.use-case';
import { SubmitRatingUseCase } from '../use-cases/complaints/submit-rating.use-case';
import { CreateLogbookEntryUseCase } from '../use-cases/logbook/create-logbook-entry.use-case';
import { ManageHotspotsUseCase } from '../use-cases/hotspots/manage-hotspots.use-case';
import { CalculateCadDispatchUseCase } from '../use-cases/cad/calculate-cad-dispatch.use-case';
import { LoginUseCase } from '../use-cases/auth/login.use-case';
import { GetPawasDashboardUseCase } from '../use-cases/pawas/get-pawas-dashboard.use-case';
import { GetPawasMapUseCase } from '../use-cases/pawas/get-pawas-map.use-case';
import { GetPawasAnalyticsUseCase } from '../use-cases/pawas/get-pawas-analytics.use-case';
import { GetPawasLogbookUseCase } from '../use-cases/pawas/get-pawas-logbook.use-case';
import { ValidateLogbookUseCase } from '../use-cases/logbook/validate-logbook.use-case';

// Singleton Repositories
const complaintRepo: IComplaintRepository = new PrismaComplaintRepository();
const officerRepo: IOfficerRepository = new PrismaOfficerRepository();
const logbookRepo: ILogbookRepository = new PrismaLogbookRepository();
const hotspotRepo: IHotspotRepository = new PrismaHotspotRepository();
const userRepo: IUserRepository = new PrismaUserRepository();
const piketRepo: IPiketRepository = new PrismaPiketRepository();
const masterRepo: IMasterRepository = new PrismaMasterRepository();
const deviceRepo: IDeviceRepository = new PrismaDeviceRepository();
const knowledgeRepo: IKnowledgeRepository = new PrismaKnowledgeRepository();
const chatRepo: IChatRepository = new PrismaChatRepository();

export class UseCaseFactory {
  // Use Case Getters
  static getLoginUseCase(): LoginUseCase {
    return new LoginUseCase(userRepo);
  }

  static getCreateComplaintUseCase(): CreateComplaintUseCase {
    return new CreateComplaintUseCase(complaintRepo);
  }

  static getDispatchComplaintUseCase(): DispatchComplaintUseCase {
    return new DispatchComplaintUseCase(complaintRepo, officerRepo);
  }

  static getFieldStepActionUseCase(): FieldStepActionUseCase {
    return new FieldStepActionUseCase(complaintRepo);
  }

  static getSubmitRatingUseCase(): SubmitRatingUseCase {
    return new SubmitRatingUseCase(complaintRepo);
  }

  static getCreateLogbookEntryUseCase(): CreateLogbookEntryUseCase {
    return new CreateLogbookEntryUseCase(logbookRepo);
  }

  static getManageHotspotsUseCase(): ManageHotspotsUseCase {
    return new ManageHotspotsUseCase(hotspotRepo);
  }

  static getCalculateCadDispatchUseCase(): CalculateCadDispatchUseCase {
    return new CalculateCadDispatchUseCase(officerRepo);
  }

  static getPawasDashboardUseCase(): GetPawasDashboardUseCase {
    return new GetPawasDashboardUseCase(complaintRepo);
  }

  static getPawasMapUseCase(): GetPawasMapUseCase {
    return new GetPawasMapUseCase(hotspotRepo);
  }

  static getPawasAnalyticsUseCase(): GetPawasAnalyticsUseCase {
    return new GetPawasAnalyticsUseCase(complaintRepo);
  }

  static getPawasLogbookUseCase(): GetPawasLogbookUseCase {
    return new GetPawasLogbookUseCase(logbookRepo);
  }

  static getValidateLogbookUseCase(): ValidateLogbookUseCase {
    return new ValidateLogbookUseCase(logbookRepo);
  }

  // Pure Interface Access (Dependency Inversion Principle)
  static getComplaintRepository(): IComplaintRepository {
    return complaintRepo;
  }

  static getOfficerRepository(): IOfficerRepository {
    return officerRepo;
  }

  static getLogbookRepository(): ILogbookRepository {
    return logbookRepo;
  }

  static getHotspotRepository(): IHotspotRepository {
    return hotspotRepo;
  }

  static getUserRepository(): IUserRepository {
    return userRepo;
  }

  static getPiketRepository(): IPiketRepository {
    return piketRepo;
  }

  static getMasterRepository(): IMasterRepository {
    return masterRepo;
  }

  static getDeviceRepository(): IDeviceRepository {
    return deviceRepo;
  }

  static getKnowledgeRepository(): IKnowledgeRepository {
    return knowledgeRepo;
  }

  static getChatRepository(): IChatRepository {
    return chatRepo;
  }
}

