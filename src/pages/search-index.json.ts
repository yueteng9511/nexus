/**
 * 建置時輸出 /search-index.json（靜態檔），供 SearchBox 使用。
 */
import type { APIRoute } from 'astro';
import { buildSearchIndex } from '../lib/search';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(await buildSearchIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
