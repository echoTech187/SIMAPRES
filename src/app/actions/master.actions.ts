

/**
 * SIMAPRES 110 - Master Data Server Actions (Modular Architecture Barrel)
 * Refactored into cohesive domain modules under src/app/actions/master/
 * Adheres to Fowler's Separation of Concerns & Clean Architecture principles.
 */

// 1. Lookups & Summary Counters
export * from './master/master-lookups.actions';

// 2. Stations & Units & Hierarchies
export * from './master/master-station.actions';

// 3. Personnel Ranks & Roles & Duty Statuses
export * from './master/master-personnel.actions';

// 4. Incident Categories & Subcategories & Resolution Evidence
export * from './master/master-incident.actions';

// 5. Hotspots & Danger Levels
export * from './master/master-hotspot.actions';

// 6. Fleet & Patrol Vehicles & Fuel Management
export * from './master/master-fleet.actions';
