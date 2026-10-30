import redis from "./redis.js";

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetchData: () => Promise<T>
): Promise<T> {
  try {
    const cachedData = await redis.get(key);

    if (cachedData) {
      console.log(`Cache HIT: ${key}`);
      return JSON.parse(cachedData) as T;
    }
  } catch (error) {
    console.error("Redis cache read failed:", error);
  }

  console.log(`Cache MISS: ${key}`);

  const data = await fetchData();

  try {
    await redis.set(
      key,
      JSON.stringify(data),
      "EX",
      ttlSeconds
    );
  } catch (error) {
    console.error("Redis cache write failed:", error);
  }

  return data;
}

export async function getCacheVersion(
  namespace: string
): Promise<number> {
  try {
    const version = await redis.get(`${namespace}:version`);
    return Number(version ?? 0);
  } catch (error) {
    console.error("Cache version read failed:", error);
    return 0;
  }
}

export async function invalidateCache(
  namespace: string
): Promise<void> {
  try {
    await redis.incr(`${namespace}:version`);
    console.log(`Cache invalidated: ${namespace}`);
  } catch (error) {
    console.error("Cache invalidation failed:", error);
  }
}