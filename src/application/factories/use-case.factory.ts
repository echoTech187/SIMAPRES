import { PrismaComplaintRepository } from '@/infrastructure/repositories/prisma-complaint.repository';
import { PrismaOfficerRepository } from '@/infrastructure/repositories/prisma-officer.repository';
import { PrismaLogbookRepository } from '@/infrastructure/repositories/prisma-logbook.repository';
import { PrismaHotspotRepository } from '@/infrastructure/repositories/prisma-hotspot.repository';
import { PrismaUserRepository } from '@/infrastructure/repositories/prisma-user.repository';

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

// Singleton Repositories
const complaintRepo = new PrismaComplaintRepository();
const officerRepo = new PrismaOfficerRepository();
const logbookRepo = new PrismaLogbookRepository();
const hotspotRepo = new PrismaHotspotRepository();
const userRepo = new PrismaUserRepository();

export class UseCaseFactory {
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

  // Direct repo access for queries
  static getComplaintRepository(): PrismaComplaintRepository {
    return complaintRepo;
  }

  static getOfficerRepository(): PrismaOfficerRepository {
    return officerRepo;
  }

  static getLogbookRepository(): PrismaLogbookRepository {
    return logbookRepo;
  }

  static getHotspotRepository(): PrismaHotspotRepository {
    return hotspotRepo;
  }
}
