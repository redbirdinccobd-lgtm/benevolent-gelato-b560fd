/**
 * Cloudflare Automated DNS & Domain Setup Script
 * Connects redbird-international.com to Google Cloud Run
 */

import https from 'https';

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const DOMAIN = 'redbird-international.com';
const TARGET_HOST = 'ais-pre-ziwwkovm2dex5yeaykpkjq-162933049095.asia-southeast1.run.app';

async function cfRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.cloudflare.com/client/v4${endpoint}`);
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

export async function configureCloudflare(token = CF_API_TOKEN) {
  if (!token) {
    console.error('Error: Cloudflare API Token is missing.');
    return;
  }

  console.log(`Verifying Cloudflare Zone for ${DOMAIN}...`);
  const zonesRes = await cfRequest(`/zones?name=${DOMAIN}`);
  if (!zonesRes.data?.success || zonesRes.data.result.length === 0) {
    console.error('Failed to find zone for domain:', DOMAIN, zonesRes.data?.errors);
    return;
  }

  const zoneId = zonesRes.data.result[0].id;
  console.log(`Found Zone ID: ${zoneId}`);

  // 1. List current DNS records
  const dnsRes = await cfRequest(`/zones/${zoneId}/dns_records`);
  const records = dnsRes.data?.result || [];
  console.log(`Current DNS Records: ${records.length}`);

  // 2. Delete conflicting A records for root and www
  for (const rec of records) {
    if ((rec.name === DOMAIN || rec.name === `www.${DOMAIN}`) && (rec.type === 'A' || rec.type === 'CNAME')) {
      console.log(`Removing old ${rec.type} record: ${rec.name} -> ${rec.content}`);
      await cfRequest(`/zones/${zoneId}/dns_records/${rec.id}`, 'DELETE');
    }
  }

  // 3. Create CNAME or Worker dummy records
  console.log(`Adding CNAME for root domain @ -> ${TARGET_HOST}`);
  const rootCname = await cfRequest(`/zones/${zoneId}/dns_records`, 'POST', {
    type: 'CNAME',
    name: '@',
    content: TARGET_HOST,
    proxied: true,
    ttl: 1
  });
  console.log('Root CNAME result:', rootCname.data?.success ? 'SUCCESS' : rootCname.data?.errors);

  console.log(`Adding CNAME for www -> ${TARGET_HOST}`);
  const wwwCname = await cfRequest(`/zones/${zoneId}/dns_records`, 'POST', {
    type: 'CNAME',
    name: 'www',
    content: TARGET_HOST,
    proxied: true,
    ttl: 1
  });
  console.log('WWW CNAME result:', wwwCname.data?.success ? 'SUCCESS' : wwwCname.data?.errors);

  // 4. Set SSL/TLS to Full
  console.log('Setting SSL/TLS encryption mode to Full...');
  const sslRes = await cfRequest(`/zones/${zoneId}/settings/ssl`, 'PATCH', {
    value: 'full'
  });
  console.log('SSL setting result:', sslRes.data?.success ? 'SUCCESS' : sslRes.data?.errors);

  console.log('Cloudflare configuration complete!');
}

if (process.argv[1] && process.argv[1].endsWith('cloudflare-setup.mjs')) {
  configureCloudflare();
}
