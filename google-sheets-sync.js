/**
 * Google Sheets Synchronization Engine for Customer Database
 * Synchronizes customer registration & profile data to Google Spreadsheet:
 * "CLOTHING STORE – CUSTOMER DATABASE" (abhinandkilivayil@gmail.com)
 * Spreadsheet ID: 15UoQivVjSo82UWmB-cZo75M2Hquqgzp-pVfEDD2G8QM
 */
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '15UoQivVjSo82UWmB-cZo75M2Hquqgzp-pVfEDD2G8QM';
const SPREADSHEET_NAME = 'CLOTHING STORE – CUSTOMER DATABASE';
const GOOGLE_ACCOUNT = 'abhinandkilivayil@gmail.com';
const SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

// Locate gsheets CLI binary
const PLUGIN_BIN_PATH = path.join(
  process.env.USERPROFILE || 'C:\\Users\\MOHAMMED NAJWAN T',
  '.gemini', 'antigravity', 'plugin_data', 'gsheets', 'bin', 'gsheets-986250228.exe'
);

const GSHEETS_CMD = fs.existsSync(PLUGIN_BIN_PATH) ? PLUGIN_BIN_PATH : 'gsheets';

// Persistent sync state and retry queue
const QUEUE_FILE = path.join(__dirname, 'data', 'sheets_sync_queue.json');

const syncState = {
  status: 'CONNECTED',
  googleAccount: GOOGLE_ACCOUNT,
  spreadsheetId: SPREADSHEET_ID,
  spreadsheetTitle: SPREADSHEET_NAME,
  spreadsheetUrl: SPREADSHEET_URL,
  lastSyncTime: null,
  totalSynced: 0,
  lastError: null,
  logs: []
};

function addLog(action, message, level = 'info') {
  const logEntry = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action,
    message,
    level
  };
  syncState.logs.unshift(logEntry);
  if (syncState.logs.length > 50) syncState.logs.pop();
  console.log(`[SHEETS_SYNC][${action}] ${message}`);
}

// Queue management for failed synchronizations
function loadQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to read sync queue file:', e);
  }
  return [];
}

function saveQueue(queue) {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write sync queue file:', e);
  }
}

function enqueueRetry(customer, address, reason) {
  const queue = loadQueue();
  const custId = customer.customer_id || customer.id;
  const existingIdx = queue.findIndex(q => q.customerId === custId);
  const item = {
    customerId: custId,
    customer,
    address,
    reason,
    retries: existingIdx >= 0 ? queue[existingIdx].retries + 1 : 1,
    lastAttempt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = item;
  } else {
    queue.push(item);
  }
  saveQueue(queue);
  addLog('RETRY_ENQUEUED', `Customer ${custId} queued for automatic retry: ${reason}`, 'warning');
}

function dequeueRetry(customerId) {
  let queue = loadQueue();
  queue = queue.filter(q => q.customerId !== customerId);
  saveQueue(queue);
}

// Command execution helper
function runGSheets(args) {
  return new Promise((resolve, reject) => {
    execFile(GSHEETS_CMD, args, { maxBuffer: 10 * 1024 * 1024, env: process.env }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || stdout || err.message));
      }
      resolve(stdout.trim());
    });
  });
}

function escapeCell(val) {
  if (val === null || val === undefined) return '';
  let str = String(val).replace(/[\r\n\t]+/g, ' ').trim();
  // Prefix leading + or = with ' so Google Sheets treats it as pure string instead of formula
  if (str.startsWith('+') || str.startsWith('=')) {
    str = "'" + str;
  }
  // In gsheets CLI: commas must be escaped with \, and | is row separator
  return str.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/\|/g, '/');
}

function formatCustomerRow(customer, address = null) {
  const custId = customer.customer_id || customer.id || '';
  const fullName = customer.full_name || customer.name || '';
  const email = customer.email || '';
  const mobile = customer.mobile_number || customer.phone || '';

  const house = (address && address.house_name) || customer.house_name || '';
  const street = (address && address.street) || customer.street || '';
  const locality = (address && address.locality) || customer.locality || '';
  const city = (address && address.city) || customer.city || '';
  const state = (address && address.state) || customer.state || '';
  const pin = (address && address.pin_code) || customer.pin_code || customer.pincode || '';
  const country = (address && address.country) || customer.country || 'India';

  const regDate = customer.created_at || customer.joinedDate || new Date().toISOString();
  const emailStatus = customer.email_verified ? 'Verified' : 'Pending Verification';
  const accountStatus = (customer.account_status || customer.status || 'active').toLowerCase() === 'disabled' ? 'Disabled' : 'Active';
  const lastLogin = customer.last_login || 'Never';

  // NEVER output passwords, hashes, salts, or OTPs
  return [
    escapeCell(custId),
    escapeCell(fullName),
    escapeCell(email),
    escapeCell(mobile),
    escapeCell(house),
    escapeCell(street),
    escapeCell(locality),
    escapeCell(city),
    escapeCell(state),
    escapeCell(pin),
    escapeCell(country),
    escapeCell(regDate),
    escapeCell(emailStatus),
    escapeCell(accountStatus),
    escapeCell(lastLogin)
  ].join(',');
}

/**
 * Synchronize a single customer to Google Sheets.
 * If customer exists in Sheet, updates their row. If not, appends as new row.
 */
async function syncSingleCustomer(customer, address = null) {
  const custId = customer.customer_id || customer.id;
  if (!custId) return { success: false, message: 'Invalid customer ID' };

  try {
    syncState.status = 'SYNCING';
    const rowCsv = formatCustomerRow(customer, address);

    // Read column A to check existing rows
    const out = await runGSheets(['readonly', 'read', SPREADSHEET_ID, 'Sheet1!A:A', '--json']);
    let rows = [];
    try {
      rows = JSON.parse(out);
    } catch (e) {
      rows = [];
    }

    let existingRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] && rows[i][0].toString().trim() === custId.toString().trim()) {
        existingRowIndex = i + 1; // 1-based index in Google Sheets
        break;
      }
    }

    if (existingRowIndex > 0) {
      // Update existing row
      const range = `Sheet1!A${existingRowIndex}:O${existingRowIndex}`;
      await runGSheets(['mutate', 'write', SPREADSHEET_ID, range, rowCsv]);
      addLog('UPDATE_ROW', `Updated row ${existingRowIndex} for customer ${custId} (${customer.email})`);
    } else {
      // Append as new row
      await runGSheets(['mutate', 'append', SPREADSHEET_ID, 'Sheet1', rowCsv]);
      addLog('APPEND_ROW', `Appended new row for customer ${custId} (${customer.email})`);
    }

    dequeueRetry(custId);
    syncState.status = 'CONNECTED';
    syncState.lastSyncTime = new Date().toISOString();
    syncState.totalSynced += 1;
    syncState.lastError = null;

    return { success: true, customerId: custId, action: existingRowIndex > 0 ? 'updated' : 'appended' };
  } catch (err) {
    console.error(`[SHEETS_SYNC_ERROR] Customer ${custId}:`, err.message);
    syncState.status = 'ERROR';
    syncState.lastError = err.message;
    enqueueRetry(customer, address, err.message);
    addLog('SYNC_FAILED', `Failed to sync customer ${custId}: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

/**
 * Synchronize ALL customers from the local database to Google Sheets
 */
async function syncAllCustomers(db) {
  try {
    syncState.status = 'SYNCING';
    addLog('BATCH_SYNC_START', 'Starting full synchronization of customer database...');

    const customers = db.customers || [];
    const addresses = db.customer_addresses || [];

    if (customers.length === 0) {
      syncState.status = 'CONNECTED';
      return { success: true, count: 0, message: 'No customers found to sync.' };
    }

    // Format all rows
    const rows = customers.map(c => {
      const custId = c.customer_id || c.id;
      const custAddrs = addresses.filter(a => a.customer_id === custId);
      const defaultAddr = custAddrs.find(a => a.is_default) || custAddrs[0] || null;
      return formatCustomerRow(c, defaultAddr);
    });

    const valuesPayload = rows.join('|');
    const range = `Sheet1!A2:O${customers.length + 1}`;

    await runGSheets(['mutate', 'write', SPREADSHEET_ID, range, valuesPayload]);

    // Format table header and auto-resize
    try {
      await runGSheets([
        'mutate', 'format', SPREADSHEET_ID,
        '--sheet-id', '0',
        '--start-row', '0', '--end-row', '1',
        '--start-col', '0', '--end-col', '15',
        '--bold', '--bg-color', '#1E293B', '--fg-color', '#FFFFFF', '--align', 'CENTER'
      ]);
      await runGSheets(['mutate', 'freeze', SPREADSHEET_ID, '--sheet-id', '0', '--rows', '1']);
    } catch (fmtErr) {
      console.warn('Formatting warning:', fmtErr.message);
    }

    syncState.status = 'CONNECTED';
    syncState.lastSyncTime = new Date().toISOString();
    syncState.totalSynced = customers.length;
    syncState.lastError = null;

    addLog('BATCH_SYNC_COMPLETE', `Successfully synchronized ${customers.length} customer records to Google Sheets.`);

    // Clear queue if all synced
    saveQueue([]);

    return {
      success: true,
      count: customers.length,
      lastSyncTime: syncState.lastSyncTime,
      message: `Successfully synchronized ${customers.length} customers to Google Sheets.`
    };
  } catch (err) {
    console.error('[SHEETS_SYNC_BATCH_ERROR]', err.message);
    syncState.status = 'ERROR';
    syncState.lastError = err.message;
    addLog('BATCH_SYNC_ERROR', `Full sync failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

/**
 * Process pending retry queue
 */
async function processRetryQueue() {
  const queue = loadQueue();
  if (queue.length === 0) return;

  addLog('RETRY_PROCESS_START', `Processing retry queue (${queue.length} items)...`);
  for (const item of [...queue]) {
    try {
      const res = await syncSingleCustomer(item.customer, item.address);
      if (res.success) {
        dequeueRetry(item.customerId);
      }
    } catch (e) {
      console.error('Retry failed for', item.customerId, e.message);
    }
  }
}

// Background auto-retry loop every 60 seconds
setInterval(() => {
  const queue = loadQueue();
  if (queue.length > 0) {
    processRetryQueue().catch(console.error);
  }
}, 60000);

/**
 * Get current synchronization status and details
 */
function getSyncStatus(db = null) {
  const queue = loadQueue();
  const dbCustomersCount = db ? (db.customers || []).length : 0;

  return {
    success: true,
    status: syncState.status,
    googleAccount: GOOGLE_ACCOUNT,
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetTitle: SPREADSHEET_NAME,
    spreadsheetUrl: SPREADSHEET_URL,
    lastSyncTime: syncState.lastSyncTime,
    totalRegisteredInDB: dbCustomersCount,
    totalSynced: syncState.totalSynced,
    queueCount: queue.length,
    pendingRetries: queue.map(q => ({ customerId: q.customerId, lastAttempt: q.lastAttempt, retries: q.retries })),
    lastError: syncState.lastError,
    recentLogs: syncState.logs.slice(0, 20)
  };
}

module.exports = {
  SPREADSHEET_ID,
  SPREADSHEET_NAME,
  GOOGLE_ACCOUNT,
  SPREADSHEET_URL,
  syncSingleCustomer,
  syncAllCustomers,
  processRetryQueue,
  getSyncStatus,
  loadQueue
};
