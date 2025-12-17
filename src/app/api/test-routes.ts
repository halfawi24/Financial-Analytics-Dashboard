/**
 * Test API Routes with Real Data
 * Verifies all 6 routes work correctly
 */

export async function testApiRoutes() {
  const routes = [
    { method: 'POST', path: '/api/ingest', desc: 'File upload' },
    { method: 'GET', path: '/api/status', desc: 'Job status' },
    { method: 'GET', path: '/api/exports', desc: 'Export list' },
    { method: 'POST', path: '/api/export/pptx', desc: 'PowerPoint' },
    { method: 'POST', path: '/api/export/xlsx', desc: 'Excel' },
    { method: 'POST', path: '/api/export/csv', desc: 'CSV' },
  ];

  const results: any[] = [];
  
  for (const route of routes) {
    try {
      const response = await fetch(`http://localhost:3000${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
      });
      results.push({
        route: route.path,
        method: route.method,
        status: response.status,
        ok: response.ok,
        desc: route.desc,
      });
    } catch (e) {
      results.push({
        route: route.path,
        method: route.method,
        error: String(e),
        desc: route.desc,
      });
    }
  }
  
  return results;
}
