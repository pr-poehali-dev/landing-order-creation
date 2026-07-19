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

  verifyLogin: (email: string, code: string) =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'verify_login', email, code }) }).then(r => r.json()),

  requestReset: (email: string) =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'request_reset', email }) }).then(r => r.json()),

  resetPassword: (email: string, code: string, new_password: string) =>
    fetch(URLS.auth, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reset_password', email, code, new_password }) }).then(r => r.json()),

  me: () =>
    fetch(URLS.auth, { method: 'GET', headers: authHeaders() }).then(r => r.json()),

  logout: () =>
    fetch(URLS.auth, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'logout' }) }).then(r => r.json()),

  getProjects: () =>
    fetch(`${URLS.cabinet}?action=projects`, { headers: authHeaders() }).then(r => r.json()),

  getUnread: () =>
    fetch(`${URLS.cabinet}?action=unread`, { headers: authHeaders() }).then(r => r.json()),

  getFiles: (projectId: number) =>
    fetch(`${URLS.cabinet}?action=files&project_id=${projectId}`, { headers: authHeaders() }).then(r => r.json()),

  getMessages: (projectId: number) =>
    fetch(`${URLS.cabinet}?action=messages&project_id=${projectId}`, { headers: authHeaders() }).then(r => r.json()),

  sendMessage: (projectId: number, text: string) =>
    fetch(URLS.cabinet, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'send_message', project_id: projectId, text }) }).then(r => r.json()),

  getInvoices: (projectId: number) =>
    fetch(`${URLS.cabinet}?action=invoices&project_id=${projectId}`, { headers: authHeaders() }).then(r => r.json()),

  markInvoicePaid: (invoiceId: number) =>
    fetch(URLS.cabinet, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'mark_paid', invoice_id: invoiceId }) }).then(r => r.json()),

  adminGetUsers: () =>
    fetch(`${URLS.admin}?action=users`, { headers: authHeaders() }).then(r => r.json()),

  adminGetProjects: () =>
    fetch(`${URLS.admin}?action=projects`, { headers: authHeaders() }).then(r => r.json()),

  adminGetUnread: () =>
    fetch(`${URLS.admin}?action=unread`, { headers: authHeaders() }).then(r => r.json()),

  adminChangePassword: (current_password: string, new_password: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'change_password', current_password, new_password }) }).then(r => r.json()),

  adminCreateUser: (name: string, email: string, password: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'create_user', name, email, password }) }).then(r => r.json()),

  adminCreateProject: (user_id: number, title: string, status: string, description: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'create_project', user_id, title, status, description }) }).then(r => r.json()),

  adminUpdateStatus: (project_id: number, status: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'update_status', project_id, status }) }).then(r => r.json()),

  adminAddFile: (project_id: number, name: string, url: string, file_type: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'add_file', project_id, name, url, file_type }) }).then(r => r.json()),

  adminDeleteFile: (file_id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_file', file_id }) }).then(r => r.json()),

  adminAddInvoice: (project_id: number, title: string, amount: number, file_url: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'add_invoice', project_id, title, amount, file_url }) }).then(r => r.json()),

  adminConfirmPayment: (invoice_id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'confirm_payment', invoice_id }) }).then(r => r.json()),

  adminDeleteInvoice: (invoice_id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_invoice', invoice_id }) }).then(r => r.json()),

  adminUploadFile: (project_id: number, file_name: string, file_data: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'upload_file', project_id, file_name, file_data }) }).then(r => r.json()),

  uploadFile: (project_id: number, file_name: string, file_data: string) =>
    fetch(URLS.cabinet, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'upload_file', project_id, file_name, file_data }) }).then(r => r.json()),

  sendTyping: (project_id: number) =>
    fetch(URLS.cabinet, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'typing', project_id }) }).then(r => r.json()),

  getTyping: (project_id: number) =>
    fetch(URLS.cabinet, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'get_typing', project_id }) }).then(r => r.json()),

  adminSendTyping: (project_id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'typing', project_id }) }).then(r => r.json()),

  adminGetTyping: (project_id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'get_typing', project_id }) }).then(r => r.json()),

  adminDeleteUser: (user_id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_user', user_id }) }).then(r => r.json()),

  adminUpdateUser: (user_id: number, name: string, email: string, password: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'update_user', user_id, name, email, password }) }).then(r => r.json()),

  adminSendMessage: (project_id: number, text: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'send_message', project_id, text }) }).then(r => r.json()),

  notifyFileUploaded: (project_id: number, file_name: string, file_url: string) =>
    fetch(URLS.notify, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'file_uploaded', project_id, file_name, file_url }) }).then(r => r.json()),

  notifyIfOffline: (project_id: number, message_text: string) =>
    fetch(URLS.notify, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'message', project_id, message_text }) }).then(r => r.json()),

  notifyStatusChanged: (project_id: number, status: string) =>
    fetch(URLS.notify, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'status', project_id, status }) }).then(r => r.json()),

  notifyInvoice: (project_id: number, invoice_title: string, amount: number) =>
    fetch(URLS.notify, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'invoice', project_id, invoice_title, amount }) }).then(r => r.json()),

  getPublicContent: () =>
    fetch(`${URLS.admin}?action=public`).then(r => r.json()),

  adminGetSections: () =>
    fetch(`${URLS.admin}?action=sections`, { headers: authHeaders() }).then(r => r.json()),

  adminToggleSection: (key: string, enabled: boolean) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'toggle_section', key, enabled }) }).then(r => r.json()),

  adminGetPromos: () =>
    fetch(`${URLS.admin}?action=promos`, { headers: authHeaders() }).then(r => r.json()),

  adminSavePromo: (promo: { id?: number; title: string; description: string; badge: string; old_price: string; new_price: string; active: boolean; sort_order: number }) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'save_promo', ...promo }) }).then(r => r.json()),

  adminDeletePromo: (id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_promo', id }) }).then(r => r.json()),

  adminGetReviews: () =>
    fetch(`${URLS.admin}?action=reviews`, { headers: authHeaders() }).then(r => r.json()),

  adminSaveReview: (review: { id?: number; name: string; role: string; text: string; rating: number; active: boolean; sort_order: number }) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'save_review', ...review }) }).then(r => r.json()),

  adminDeleteReview: (id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_review', id }) }).then(r => r.json()),

  adminGetPortfolio: () =>
    fetch(`${URLS.admin}?action=portfolio`, { headers: authHeaders() }).then(r => r.json()),

  adminSavePortfolio: (item: { id?: number; title: string; category: string; image_url: string; color: string; active: boolean; sort_order: number }) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'save_portfolio', ...item }) }).then(r => r.json()),

  adminDeletePortfolio: (id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_portfolio', id }) }).then(r => r.json()),

  adminUploadImage: (file_name: string, file_data: string) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'upload_image', file_name, file_data }) }).then(r => r.json()),

  getArticle: (slug: string) =>
    fetch(`${URLS.admin}?action=article&slug=${encodeURIComponent(slug)}`).then(r => r.json()),

  adminGetArticles: () =>
    fetch(`${URLS.admin}?action=articles`, { headers: authHeaders() }).then(r => r.json()),

  adminSaveArticle: (article: { id?: number; slug?: string; title: string; excerpt: string; content: string; cover_url: string; published: boolean }) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'save_article', ...article }) }).then(r => r.json()),

  adminDeleteArticle: (id: number) =>
    fetch(URLS.admin, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'delete_article', id }) }).then(r => r.json()),
};