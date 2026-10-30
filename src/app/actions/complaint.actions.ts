
/**
 * SIMAPRES Complaint Actions (Modularized Barrel)
 * Delegates all complaint operations to cohesive sub-modules:
 * - complaint-common: Shared DB repo proxy, cache invalidation, serialization & normalization
 * - complaint-crud.actions: Ticket creation, SPKT duty details, desk resolution
 * - complaint-dispatch.actions: Dispatching, assignment, multi-unit disposisi & cross-jurisdiction transfer
 * - complaint-lifecycle.actions: Status updates, field steps, Pawas pengesahan, ratings, QR check-in
 * - complaint-query.actions: Ticket lookups, search, filtering options, tracking token, WhatsApp notification
 * - complaint-analytics.actions: Officer, station, and operator performance rankings & IKM stats
 */

export * from './complaint';
