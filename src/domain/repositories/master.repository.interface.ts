/**
 * SIMAPRES 110 - DOMAIN REPOSITORY INTERFACE: MASTER DATA & LOOKUPS
 * Lapisan: Domain (Pure TypeScript, Zero Framework Dependency)
 */

export interface IMasterRepository {
  getMasterLookupsBundle(): Promise<any>;
  getMasterCounters(): Promise<any>;
  getAllStations(): Promise<any[]>;
  getAllCategories(): Promise<any[]>;
  getAllUnits(): Promise<any[]>;
  executeMasterQuery(sql: string, params?: any[]): Promise<any>;
  
  findMany(modelName: string, queryOptions?: any): Promise<any[]>;
  findUnique(modelName: string, queryOptions: any): Promise<any | null>;
  findFirst(modelName: string, queryOptions?: any): Promise<any | null>;
  create(modelName: string, createOptions: any): Promise<any>;
  update(modelName: string, updateOptions: any): Promise<any>;
  delete(modelName: string, deleteOptions: any): Promise<any>;
  count(modelName: string, countOptions?: any): Promise<number>;
}
