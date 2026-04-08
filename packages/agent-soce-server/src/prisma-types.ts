/**
 * Minimal Prisma surface used by RAG/graph helpers (dependency injection).
 * Compatible with generated clients that expose these methods.
 */
export type PrismaSqlClient = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
};

export type ProviderRelationClient = PrismaSqlClient & {
  providerRelation: {
    findMany(args: {
      select: {
        providerAId: true;
        providerBId: true;
        sharedTenders: true;
      };
    }): Promise<Array<{ providerAId: string; providerBId: string; sharedTenders: number }>>;
  };
};
