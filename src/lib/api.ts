const URLS = {
  auth: 'https://functions.poehali.dev/96d4281f-b94f-4d46-a052-c9ab32b88f91',
  cabinet: 'https://functions.poehali.dev/bd83f061-f6b3-4b49-b12f-1a0007e354b9',
  admin: 'https://functions.poehali.dev/3ce65aba-6279-4e65-a710-af47b06c9b6c',
  notify: 'https://functions.poehali.dev/89c6678a-fbae-40be-b731-50a61627c3ff',
};

function getSession() {
  return localStorage.getItem('session_id') || '';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', 'X-Session-Id': getSession() };
}

export const api = {
  login: (email: string, password: string) =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', email, password }) }).then(r => r.json()),

  me: () =>
    fetch(URLS.auth, { method: 'GET', headers: authHeaders() }).then(r => r.json()),

  logout: () =>
    fetch(URLS.auth, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'logout' }) }).then(r => r.json()),

  getProjects: () =>
    fetch(`${URLS.cabinet}?action=projects`, { headers: authHeaders() }).then(r => r.json()),

  getFiles: (projectId: number) =>
    fetch(`${URLS.cabinet}?action=files&project_id=${projectId}`, { headers: authHeaders() }).then(r => r.json()),

  getMessages: (projectId: number) =>
    fetch(`${URLS.cabinet}?action=messages&project_id=${projectId}`, { headers: authHeaders() }).then(r => r.json()),

  sendMessage: (projectId: number, text: string) =>
    fetch(URLS.cabinet, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'send_message', project_id: projectId, text }) }).then(r => r.json()),

  getInvoices: (projectId: number) =>
    fetch(`${URLS.cabinet}?action=invoices&project_id=${projectId}`, { headers: authHeaders() }).then(r => r.json()),

  adminGetUsers: () =>
    fetch(`${URLS.admin}?action=users`, { headers: authHeaders() }).then(r => r.json()),

  adminGetProjects: () =>
    fetch(`${URLS.admin}?action=projects`, { headers: authHeaders() }).then(r => r.json()),

  adminCreateUser: (name: string, email: string, password: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'create_user', name, email, password }) }).then(r => r.json()),

  adminCreateProject: (user_id: number, title: string, status: string, description: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'create_project', user_id, title, status, description }) }).then(r => r.json()),

  adminUpdateStatus: (project_id: number, status: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'update_status', project_id, status }) }).then(r => r.json()),

  adminAddFile: (project_id: number, name: string, url: string, file_type: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'add_file', project_id, name, url, file_type }) }).then(r => r.json()),

  adminAddInvoice: (project_id: number, title: string, amount: number, file_url: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'add_invoice', project_id, title, amount, file_url }) }).then(r => r.json()),

  adminDeleteUser: (user_id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_user', user_id }) }).then(r => r.json()),

  adminUpdateUser: (user_id: number, name: string, email: string, password: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'update_user', user_id, name, email, password }) }).then(r => r.json()),

  adminSendMessage: (project_id: number, text: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'send_message', project_id, text }) }).then(r => r.json()),

  notifyIfOffline: (project_id: number, message_text: string) =>
    fetch(URLS.notify, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'message', project_id, message_text }) }).then(r => r.json()),

  notifyStatusChanged: (project_id: number, status: string) =>
    fetch(URLS.notify, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'status', project_id, status }) }).then(r => r.json()),

  notifyInvoice: (project_id: number, invoice_title: string, amount: number) =>
    fetch(URLS.notify, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'invoice', project_id, invoice_title, amount }) }).then(r => r.json()),
};