# Laporan Pengujian Otomatis SIMAPRES 110 (154 Tests Passed)

> **Ringkasan**: Seluruh 154 skenario pengujian unit & integrasi pada arsitektur Clean Architecture SIMAPRES 110 berhasil dilewati (100% Pass Rate) tanpa satupun kegagalan.

## 1. Domain Layer (Entities & Rules)

### Berkas: src/domain/entities/__tests__/complaint-entity.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 1 | ComplaintEntity Domain Methods & PDP Compliance > Citizen Privacy Protection (UU PDP No. 27/2022) → masks the middle 4 digits of citizen phone number | **PASSED** |
| 2 | ComplaintEntity Domain Methods & PDP Compliance > Citizen Privacy Protection (UU PDP No. 27/2022) → returns **** for unusually short phone numbers (< 8 chars) | **PASSED** |
| 3 | ComplaintEntity Domain Methods & PDP Compliance > Field Step Transitions & Audit Timelines → advances to tahap 3 (Meluncur) and logs timeline step | **PASSED** |
| 4 | ComplaintEntity Domain Methods & PDP Compliance > Field Step Transitions & Audit Timelines → advances to tahap 4 (Tiba di TKP) with GPS discrepancy audit | **PASSED** |
| 5 | ComplaintEntity Domain Methods & PDP Compliance > Field Step Transitions & Audit Timelines → advances to tahap 5 (Menunggu Pengesahan BAP) via ajukanPengesahanBap | **PASSED** |
| 6 | ComplaintEntity Domain Methods & PDP Compliance > Field Step Transitions & Audit Timelines → directly closes case to SELESAI when resolved on spot by commander | **PASSED** |
| 7 | ComplaintEntity Domain Methods & PDP Compliance > Field Step Transitions & Audit Timelines → completes complaint when validated by Pawas and accepts citizen rating | **PASSED** |

### Berkas: src/domain/rules/__tests__/complaint-rules.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 8 | Domain Rules: Complaint Action Permissions & State Machine > Operator Permissions → allows Operator to dispatch new tickets with status MENUNGGU | **PASSED** |
| 9 | Domain Rules: Complaint Action Permissions & State Machine > Operator Permissions → prevents Operator from approving resolutions (only Pawas can approve) | **PASSED** |
| 10 | Domain Rules: Complaint Action Permissions & State Machine > Pawas (Perwira Pengawas) Permissions → allows Pawas to approve resolution when ticket is awaiting approval | **PASSED** |
| 11 | Domain Rules: Complaint Action Permissions & State Machine > Pawas (Perwira Pengawas) Permissions → allows Pawas to reassign ticket before personnel departs | **PASSED** |
| 12 | Domain Rules: Complaint Action Permissions & State Machine > Field Personnel (Personil Lapangan) Lifecycle → allows assigned personnel to meluncur (depart) when in preparation stage | **PASSED** |
| 13 | Domain Rules: Complaint Action Permissions & State Machine > Field Personnel (Personil Lapangan) Lifecycle → allows personnel to confirm arrival at TKP once en route (DEPARTED) | **PASSED** |
| 14 | Domain Rules: Complaint Action Permissions & State Machine > Field Personnel (Personil Lapangan) Lifecycle → allows personnel to submit BAP and request Pawas approval once arrived at TKP | **PASSED** |
| 15 | Domain Rules: Complaint Action Permissions & State Machine > Field Personnel (Personil Lapangan) Lifecycle → prevents non-assigned personnel from taking field actions | **PASSED** |
| 16 | Domain Rules: Complaint Action Permissions & State Machine > Citizen (Warga) Permissions → allows citizen to rate IKM only when ticket is completed (SELESAI) | **PASSED** |

### Berkas: src/domain/rules/__tests__/notification-rules.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 17 | Domain Rules: WhatsApp Notification & Audit Log Policy > sanitizePhoneNumber & isValidIndonesianPhoneNumber → sanitizes messy phone inputs with dashes, spaces, and country codes | **PASSED** |
| 18 | Domain Rules: WhatsApp Notification & Audit Log Policy > sanitizePhoneNumber & isValidIndonesianPhoneNumber → returns empty string for placeholder/null phone values | **PASSED** |
| 19 | Domain Rules: WhatsApp Notification & Audit Log Policy > sanitizePhoneNumber & isValidIndonesianPhoneNumber → validates genuine Indonesian mobile numbers (9 - 15 digits) | **PASSED** |
| 20 | Domain Rules: WhatsApp Notification & Audit Log Policy > sanitizePhoneNumber & isValidIndonesianPhoneNumber → rejects short numbers, landline fragments, or letters | **PASSED** |
| 21 | Domain Rules: WhatsApp Notification & Audit Log Policy > evaluateComplaintNotificationPolicy Policy Decision → decides to notify citizen when ticket is created | **PASSED** |
| 22 | Domain Rules: WhatsApp Notification & Audit Log Policy > evaluateComplaintNotificationPolicy Policy Decision → decides to notify both citizen and assigned officer when dispatched | **PASSED** |
| 23 | Domain Rules: WhatsApp Notification & Audit Log Policy > evaluateComplaintNotificationPolicy Policy Decision → decides to invite citizen to rate IKM when case is resolved | **PASSED** |
| 24 | Domain Rules: WhatsApp Notification & Audit Log Policy > evaluateComplaintNotificationPolicy Policy Decision → suppresses citizen notification if pelaporHp is invalid or absent | **PASSED** |

### Berkas: src/domain/rules/__tests__/resolution-rules.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 25 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > validateResolutionSubmission → approves complete and compliant resolution submission | **PASSED** |
| 26 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > validateResolutionSubmission → rejects submission if resolution location is missing | **PASSED** |
| 27 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > validateResolutionSubmission → rejects submission if photo or physical evidence is completely missing | **PASSED** |
| 28 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > validateResolutionSubmission → rejects submission if notes are shorter than 10 characters | **PASSED** |
| 29 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > Restorative Justice Eligibility (Perpol No. 8/2021 Pasal 5) → strictly forbids BAP Damai for severe crime categories (Narkoba, Pembunuhan, Terorisme) | **PASSED** |
| 30 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > Restorative Justice Eligibility (Perpol No. 8/2021 Pasal 5) → rejects BAP_DAMAI in validateResolutionSubmission when crime is restricted | **PASSED** |
| 31 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > Restorative Justice Eligibility (Perpol No. 8/2021 Pasal 5) → permits Restorative Justice for general tipiring and minor disputes | **PASSED** |
| 32 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > requiresStrictTkpGps Rule → requires strict TKP GPS when resolution occurs on scene (TKP) | **PASSED** |
| 33 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > requiresStrictTkpGps Rule → allows GPS deviation when resolution is conducted at Polsek or Hospital | **PASSED** |
| 34 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > RBAC Resolution Permissions → permits assigned officer to submit resolution while ticket is in progress (DIPROSES) | **PASSED** |
| 35 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > RBAC Resolution Permissions → permits Pawas to approve or reject resolution when awaiting approval (MENUNGGU_PENGESAHAN) | **PASSED** |
| 36 | Domain Rules: Case Resolution & Restorative Justice (Perpol No. 8/2021) > RBAC Resolution Permissions → prevents regular personnel from approving their own resolution | **PASSED** |

## 2. Application Layer (Use Cases & Business Logic)

### Berkas: src/application/use-cases/cad/__tests__/calculate-cad-dispatch.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 37 | CAD Dispatch Recommendation & SOP Routing Algorithm → routes traffic accident (laka lantas / tabrakan) primarily to Sat Lantas | **PASSED** |
| 38 | CAD Dispatch Recommendation & SOP Routing Algorithm → routes criminal offenses (curanmor / begal / sajam) primarily to Sat Reskrim | **PASSED** |
| 39 | CAD Dispatch Recommendation & SOP Routing Algorithm → routes community dispute (sengketa / mediasi tetangga) primarily to Sat Binmas / Bhabin | **PASSED** |
| 40 | CAD Dispatch Recommendation & SOP Routing Algorithm → routes general public disturbance to Sat Samapta / Sabhara as primary default | **PASSED** |
| 41 | CAD Dispatch Recommendation & SOP Routing Algorithm → calculates ETA and flags isSlaAman correctly based on distance threshold | **PASSED** |

### Berkas: src/application/use-cases/auth/__tests__/login-and-token-security.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 42 | Auth & Security: Login Use Case and Device Binding → rejects login when NRP or password is empty (Zod validation) | **PASSED** |
| 43 | Auth & Security: Login Use Case and Device Binding → rejects login when user is not found in database | **PASSED** |
| 44 | Auth & Security: Login Use Case and Device Binding → rejects login when officer account is deactivated (isActive: false) | **PASSED** |
| 45 | Auth & Security: Login Use Case and Device Binding → rejects login when password does not match bcrypt hash | **PASSED** |
| 46 | Auth & Security: Login Use Case and Device Binding → routes authenticated Pawas to /console/pawas | **PASSED** |
| 47 | Auth & Security: Login Use Case and Device Binding > Hardware Device ID Binding for Field Personnel (Role: PERSONIL) → rejects Personil if hardware device ID is not bound in database | **PASSED** |
| 48 | Auth & Security: Login Use Case and Device Binding > Hardware Device ID Binding for Field Personnel (Role: PERSONIL) → rejects Personil if client device ID does not match registered device | **PASSED** |
| 49 | Auth & Security: Login Use Case and Device Binding > Hardware Device ID Binding for Field Personnel (Role: PERSONIL) → allows Personil login when client device ID matches registered device | **PASSED** |
| 50 | Citizen Tracking Token Security (HMAC-SHA256) → generates a deterministic 16-character HMAC token for a ticket | **PASSED** |
| 51 | Citizen Tracking Token Security (HMAC-SHA256) → verifies valid token for ticket with or without hash prefix | **PASSED** |
| 52 | Citizen Tracking Token Security (HMAC-SHA256) → rejects forged token or modified ticket number (Anti-Tampering) | **PASSED** |
| 53 | Citizen Tracking Token Security (HMAC-SHA256) → handles empty or malformed tokens safely without crashing | **PASSED** |

### Berkas: src/application/use-cases/complaints/__tests__/complaint-use-cases.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 54 | Complaints Use Cases Suite (Create, Dispatch, & Rating) > CreateComplaintUseCase → validates mandatory inputs and rejects missing fields | **PASSED** |
| 55 | Complaints Use Cases Suite (Create, Dispatch, & Rating) > CreateComplaintUseCase → rejects duplicate ticket number if already registered | **PASSED** |
| 56 | Complaints Use Cases Suite (Create, Dispatch, & Rating) > CreateComplaintUseCase → successfully creates new complaint with generated ticket number | **PASSED** |
| 57 | Complaints Use Cases Suite (Create, Dispatch, & Rating) > DispatchComplaintUseCase → dispatches complaint to active field officer and logs DISPATCH_ISSUED timeline | **PASSED** |
| 58 | Complaints Use Cases Suite (Create, Dispatch, & Rating) > DispatchComplaintUseCase → throws error if complaint or officer is not found | **PASSED** |
| 59 | Complaints Use Cases Suite (Create, Dispatch, & Rating) > SubmitRatingUseCase → allows citizen to submit rating once complaint is SELESAI | **PASSED** |
| 60 | Complaints Use Cases Suite (Create, Dispatch, & Rating) > SubmitRatingUseCase → rejects rating submission if complaint is still in progress (MENUNGGU/DIPROSES) | **PASSED** |

### Berkas: src/application/use-cases/complaints/__tests__/field-step-and-gps.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 61 | Anti-Fake GPS & Field Step Action Lifecycle → allows assigned officer to Meluncur (DEPARTED) from preparation stage | **PASSED** |
| 62 | Anti-Fake GPS & Field Step Action Lifecycle → detects GPS discrepancy (Anti-Fake GPS) when officer coordinates deviate from TKP | **PASSED** |
| 63 | Anti-Fake GPS & Field Step Action Lifecycle → rejects premature Tiba di TKP when ticket has not departed (still in MENUNGGU) | **PASSED** |
| 64 | Anti-Fake GPS & Field Step Action Lifecycle → validates resolution documents when submitting report at TKP | **PASSED** |

### Berkas: src/application/use-cases/pawas/__tests__/pawas-use-cases.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 65 | Pawas Use Cases: Station Isolation & Data Aggregation > GetPawasDashboardUseCase → passes stationId to repository to filter Pawas dashboard by Mako | **PASSED** |
| 66 | Pawas Use Cases: Station Isolation & Data Aggregation > GetPawasDashboardUseCase → works without stationId when called by Superadmin for all Makos | **PASSED** |
| 67 | Pawas Use Cases: Station Isolation & Data Aggregation > GetPawasAnalyticsUseCase → passes stationId to getIkmStats to isolate citizen satisfaction by Mako | **PASSED** |

### Berkas: src/application/use-cases/logbook/__tests__/logbook-and-audit.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 68 | Logbook & Dual-Location Audit (Claim vs Real GPS) > CreateLogbookEntryUseCase (Dual-Location Audit) → approves patrol logbook as VALID when actual GPS is within 500m of claimed location | **PASSED** |
| 69 | Logbook & Dual-Location Audit (Claim vs Real GPS) > CreateLogbookEntryUseCase (Dual-Location Audit) → flags logbook as PERLU_VERIFIKASI when GPS deviates > 500m (Suspicious Entry) | **PASSED** |
| 70 | Logbook & Dual-Location Audit (Claim vs Real GPS) > ValidateLogbookUseCase (Pawas Oversight) → allows Pawas to validate or reject a flagged logbook entry with notes | **PASSED** |

### Berkas: src/application/use-cases/hotspots/__tests__/manage-hotspots.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 71 | ManageHotspotsUseCase (Crime & Incident Hotspots) → retrieves all active hotspots from repository | **PASSED** |
| 72 | ManageHotspotsUseCase (Crime & Incident Hotspots) → creates new hotspot with auto-generated key prefix | **PASSED** |
| 73 | ManageHotspotsUseCase (Crime & Incident Hotspots) → updates existing hotspot or throws error if key does not exist | **PASSED** |
| 74 | ManageHotspotsUseCase (Crime & Incident Hotspots) → deletes hotspot by unique key | **PASSED** |

## 3. Infrastructure Layer (Prisma Repositories & Geodetic Services)

### Berkas: src/infrastructure/repositories/__tests__/prisma-complaint.repository.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 75 | PrismaComplaintRepository Integration Tests → findById: queries prisma.complaint.findUnique and maps relations into domain ComplaintEntity | **PASSED** |
| 76 | PrismaComplaintRepository Integration Tests → findByNomorTiket: supports multiple ticket prefix formats (#, stripped, TICKET-) | **PASSED** |
| 77 | PrismaComplaintRepository Integration Tests → findByPelaporHp: finds all complaints submitted by a citizen phone number ordered by created_at desc | **PASSED** |

### Berkas: src/infrastructure/repositories/__tests__/prisma-hotspot.repository.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 78 | PrismaHotspotRepository Integration Tests → findAll: queries prisma.hotspotLocation.findMany ordered by created_at desc | **PASSED** |
| 79 | PrismaHotspotRepository Integration Tests → findByKey: queries prisma.hotspotLocation.findUnique by key | **PASSED** |
| 80 | PrismaHotspotRepository Integration Tests → create: maps HotspotEntity to database schema and persists to prisma.hotspotLocation | **PASSED** |
| 81 | PrismaHotspotRepository Integration Tests → delete: removes hotspot record by key from database | **PASSED** |

### Berkas: src/infrastructure/repositories/__tests__/prisma-logbook.repository.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 82 | PrismaLogbookRepository Integration Tests → create: saves logbook domain entity into prisma.officerLogbook and returns mapped entity | **PASSED** |
| 83 | PrismaLogbookRepository Integration Tests → findById: queries prisma.officerLogbook.findUnique and maps DB columns | **PASSED** |
| 84 | PrismaLogbookRepository Integration Tests → updateValidationStatus: updates verification status in database and returns updated entity | **PASSED** |

### Berkas: src/infrastructure/repositories/__tests__/prisma-officer.repository.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 85 | PrismaOfficerRepository Integration Tests → findById: queries prisma.policeOfficer.findUnique and maps to OfficerEntity | **PASSED** |
| 86 | PrismaOfficerRepository Integration Tests → findByNrp: queries prisma.policeOfficer.findUnique by nrp | **PASSED** |
| 87 | PrismaOfficerRepository Integration Tests → findActiveOnDuty: filters officers by DINAS_PATROLI and PIKET_SPKT | **PASSED** |
| 88 | PrismaOfficerRepository Integration Tests → updateLocation: executes prisma.policeOfficer.update with coordinates and heartbeat timestamp | **PASSED** |
| 89 | PrismaOfficerRepository Integration Tests → updateDutyStatus: persists new dutyStatus to database | **PASSED** |
| 90 | PrismaOfficerRepository Integration Tests → updateKpiScore: persists updated KPI score to database | **PASSED** |

### Berkas: src/infrastructure/repositories/__tests__/prisma-user.repository.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 91 | PrismaUserRepository Integration Tests → findByIdentifier: queries prisma.user.findUnique with profile and station relations | **PASSED** |
| 92 | PrismaUserRepository Integration Tests → findById: queries prisma.user.findUnique by bigint ID | **PASSED** |
| 93 | PrismaUserRepository Integration Tests → updateLastLogin: updates last_login_at timestamp in database | **PASSED** |
| 94 | PrismaUserRepository Integration Tests → updateOfficerDutyStatus: updates duty_status across policeOfficer records for that user | **PASSED** |
| 95 | PrismaUserRepository Integration Tests → getRawOfficerRecord: retrieves raw police officer record with station and unit joins | **PASSED** |

### Berkas: src/infrastructure/services/__tests__/haversine-and-fuel.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 96 | Haversine Geodetic & Fuel Audit Service > Haversine Distance Calculation → returns 0 when coordinates are identical | **PASSED** |
| 97 | Haversine Geodetic & Fuel Audit Service > Haversine Distance Calculation → calculates accurate distance in meters and kilometers between Kajen and Kedungwuni | **PASSED** |
| 98 | Haversine Geodetic & Fuel Audit Service > Location Deviation Evaluation (Anti-Spoofing Audit) → passes audit as VALID when deviation is below 500 meter threshold | **PASSED** |
| 99 | Haversine Geodetic & Fuel Audit Service > Location Deviation Evaluation (Anti-Spoofing Audit) → flags audit as FLAGGED_AUDIT when deviation exceeds 500 meter threshold | **PASSED** |
| 100 | Haversine Geodetic & Fuel Audit Service > Fuel Audit Domain Standards → enforces Road Network Tortuosity Factor of 1.25x for road distance vs direct line | **PASSED** |

## 4. Server Actions Layer (Next.js 14 Server Actions)

### Berkas: src/app/actions/__tests__/auth.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 101 | Server Action Integration: auth.actions (loginInternalAction & logoutAction) > loginInternalAction → returns error when credentials or device authentication fails | **PASSED** |
| 102 | Server Action Integration: auth.actions (loginInternalAction & logoutAction) > loginInternalAction → sets secure session cookie and returns user profile upon valid credentials | **PASSED** |
| 103 | Server Action Integration: auth.actions (loginInternalAction & logoutAction) > logoutAction → deletes session cookie upon user logout | **PASSED** |

### Berkas: src/app/actions/__tests__/chat.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 104 | Server Action Integration: chat.actions (Tactical Dispatch Chat) → getTicketChatMessagesAction: returns empty array when ticket key is empty | **PASSED** |
| 105 | Server Action Integration: chat.actions (Tactical Dispatch Chat) → getTicketChatMessagesAction: queries complaint_chats table and returns messages | **PASSED** |

### Berkas: src/app/actions/__tests__/complaint.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 106 | Server Action Integration: createComplaintAction > Input Validation & Sanitation → returns error when pelaporNama is missing | **PASSED** |
| 107 | Server Action Integration: createComplaintAction > Input Validation & Sanitation → returns error when pelaporHp is missing or placeholder | **PASSED** |
| 108 | Server Action Integration: createComplaintAction > Input Validation & Sanitation → returns error when kategori/jenis kejadian is omitted | **PASSED** |
| 109 | Server Action Integration: createComplaintAction > Input Validation & Sanitation → returns error when TKP address is omitted | **PASSED** |
| 110 | Server Action Integration: createComplaintAction > Input Validation & Sanitation → returns error when GPS coordinates are NaN or missing | **PASSED** |
| 111 | Server Action Integration: createComplaintAction > Input Validation & Sanitation → returns error when ringkasanKeterangan is empty | **PASSED** |
| 112 | Server Action Integration: createComplaintAction > Happy Path: Complaint Creation Flow → executes useCase, produces serialized data with citizen tracking token and dispatches notification | **PASSED** |

### Berkas: src/app/actions/__tests__/device.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 113 | Server Action Integration: device.actions (QR Hardware Pairing) > createDevicePairingSessionAction → creates a new pairing session with WAITING status in database | **PASSED** |
| 114 | Server Action Integration: device.actions (QR Hardware Pairing) > createDevicePairingSessionAction → handles database error gracefully and returns failure | **PASSED** |
| 115 | Server Action Integration: device.actions (QR Hardware Pairing) > pairDeviceSessionAction → binds deviceId to officer and unbinds from other officers to ensure hardware exclusivity | **PASSED** |

### Berkas: src/app/actions/__tests__/fleet.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 116 | Server Action Integration: fleet.actions (Patrol Fleet & Telemetry) → getPatrolFleetUnitsAction: queries active officers and returns mapped fleet units | **PASSED** |

### Berkas: src/app/actions/__tests__/hotspot.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 117 | Server Action Integration: hotspot.actions (Crime Hotspots) > getHotspotsAction → retrieves serialized hotspots through ManageHotspotsUseCase | **PASSED** |
| 118 | Server Action Integration: hotspot.actions (Crime Hotspots) > createHotspotAction → validates title and wilayahPolsek | **PASSED** |
| 119 | Server Action Integration: hotspot.actions (Crime Hotspots) > createHotspotAction → creates hotspot successfully when inputs are valid | **PASSED** |

### Berkas: src/app/actions/__tests__/knowledge.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 120 | Server Action Integration: knowledge.actions (Police SOP & FAQ Knowledge Base) → getKnowledgeBaseItemsAction: retrieves active SOP articles and categories from database | **PASSED** |

### Berkas: src/app/actions/__tests__/logbook.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 121 | Server Action Integration: logbook.actions (Patrol Activities & Pawas Validation) → createLogbookAction: executes CreateLogbookEntryUseCase and serializes result | **PASSED** |
| 122 | Server Action Integration: logbook.actions (Patrol Activities & Pawas Validation) → validateOfficerLogbookAction: allows Pawas to approve or flag patrol activities | **PASSED** |

### Berkas: src/app/actions/__tests__/master.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 123 | Server Action Integration: master.actions (Master Data Management & Lookups) > getMasterCountersAction → queries table counters summary and returns aggregated counts | **PASSED** |
| 124 | Server Action Integration: master.actions (Master Data Management & Lookups) > getAllMasterLookupsBundleAction → returns bundled active lookups for dropdowns in single roundtrip | **PASSED** |
| 125 | Server Action Integration: master.actions (Master Data Management & Lookups) > getMasterRanksAction & createMasterRankAction → getMasterRanksAction: returns active master ranks with ordering | **PASSED** |
| 126 | Server Action Integration: master.actions (Master Data Management & Lookups) > getMasterRanksAction & createMasterRankAction → createMasterRankAction: rejects creation when key or label is missing | **PASSED** |
| 127 | Server Action Integration: master.actions (Master Data Management & Lookups) > getMasterRanksAction & createMasterRankAction → createMasterRankAction: persists valid rank data into database | **PASSED** |

### Berkas: src/app/actions/__tests__/operator-ranking.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 128 | Operator SPKT 110 Ranking (Option 1 Formula) → awards Teladan (score >= 90) to highly productive and compliant operators | **PASSED** |
| 129 | Operator SPKT 110 Ranking (Option 1 Formula) → awards Pelayanan Baik (75-89 pts) to standard competent operators | **PASSED** |
| 130 | Operator SPKT 110 Ranking (Option 1 Formula) → marks operator with 0 tickets as Siaga (Belum Ada Tiket) | **PASSED** |
| 131 | Operator SPKT 110 Ranking (Option 1 Formula) → marks low performance or sloppy input (< 60 pts) as Perlu Evaluasi SOP | **PASSED** |

### Berkas: src/app/actions/__tests__/pawas.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 132 | Server Action Integration: pawas.actions > getPawasDashboardDataAction → aggregates pending complaints, recent complaints, units, and logbooks | **PASSED** |
| 133 | Server Action Integration: pawas.actions > getPawasMapDataAction → aggregates fleet units, police offices, and hotspots for tactical map | **PASSED** |
| 134 | Server Action Integration: pawas.actions > getPawasAnalyticsDataAction → aggregates IKM satisfaction score, officer ranking, and station ranking | **PASSED** |

### Berkas: src/app/actions/__tests__/piket.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 135 | Server Action Integration: piket.actions (SPKT Duty Schedule & Sprint) → getPiketByDateAction: queries piket_schedules and members via Prisma and returns serialized schedule | **PASSED** |
| 136 | Server Action Integration: piket.actions (SPKT Duty Schedule & Sprint) → getPiketByDateAction: returns null data when no schedule is registered for date | **PASSED** |

### Berkas: src/app/actions/__tests__/upload.actions.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 137 | Server Action Integration: upload.actions (Media Upload SOP) → uploadEvidenceMediaAction: informs user that visual uploads are disabled per field efficiency SOP | **PASSED** |

## 5. Security & Helper Utilities

### Berkas: src/lib/__tests__/format-phone.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 138 | formatPhoneNumber Utility → formats standard 12-digit Indonesian mobile numbers | **PASSED** |
| 139 | formatPhoneNumber Utility → normalizes international format (+62) to standard 08xx display | **PASSED** |
| 140 | formatPhoneNumber Utility → normalizes mobile numbers starting with 8 without leading 0 | **PASSED** |
| 141 | formatPhoneNumber Utility → formats 11-digit numbers correctly | **PASSED** |
| 142 | formatPhoneNumber Utility → handles null, undefined, or empty strings gracefully | **PASSED** |
| 143 | getCleanCallNumber Utility → cleans non-numeric characters and formats for dialer tel: link | **PASSED** |
| 144 | getCleanCallNumber Utility → returns empty string for invalid or empty input | **PASSED** |

### Berkas: src/lib/__tests__/jurisdiction-boundary.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 145 | Jurisdiction Boundary & Distance Resolver > calculateHaversineDistanceKm → calculates distance between two points correctly | **PASSED** |
| 146 | Jurisdiction Boundary & Distance Resolver > calculateHaversineDistanceKm → returns 0 for identical points | **PASSED** |
| 147 | Jurisdiction Boundary & Distance Resolver > evaluateJurisdictionBoundary → detects incident in current jurisdiction (Kabupaten Pekalongan) | **PASSED** |
| 148 | Jurisdiction Boundary & Distance Resolver > evaluateJurisdictionBoundary → detects incident outside jurisdiction when address is in neighboring Batang | **PASSED** |
| 149 | Jurisdiction Boundary & Distance Resolver > evaluateJurisdictionBoundary → detects incident outside jurisdiction when address is in Kota Pekalongan | **PASSED** |

### Berkas: src/lib/__tests__/session-token.test.ts

| No | Skenario yang Diuji | Status |
|:---:|---|:---:|
| 150 | Cryptographic Session Token (Web Crypto HMAC-SHA256) → signs and verifies a valid cryptographic session token | **PASSED** |
| 151 | Cryptographic Session Token (Web Crypto HMAC-SHA256) → rejects tampered token where payload has been modified | **PASSED** |
| 152 | Cryptographic Session Token (Web Crypto HMAC-SHA256) → rejects tampered token with invalid signature | **PASSED** |
| 153 | Cryptographic Session Token (Web Crypto HMAC-SHA256) → rejects expired session token | **PASSED** |
| 154 | Cryptographic Session Token (Web Crypto HMAC-SHA256) → handles malformed token strings without throwing unhandled exceptions | **PASSED** |

