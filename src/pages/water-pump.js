import { supabase } from '../lib/supabase.js';
import { formatDate, showNotification } from '../lib/utils.js';

export async function renderWaterPumpDashboard(project) {
  const app = document.getElementById('app');

  const { data: devices } = await supabase
    .from('devices')
    .select('*')
    .eq('project_id', project.project_id);

  const { data: telemetryData, count: telemetryCount } = await supabase
    .from('wp_samples')
    .select('*', { count: 'exact' })
    .eq('project_id', project.project_id)
    .order('ts_utc', { ascending: false })
    .limit(20);

  const { data: mlModels } = await supabase
    .from('ml_models')
    .select('*')
    .eq('project_id', project.project_id)
    .order('created_at', { ascending: false });


  app.innerHTML = `
    <div class="navbar">
      <div class="navbar-container">
        <a href="/" class="navbar-brand">IoT Dashboard</a>
        <ul class="navbar-nav">
          <li><a href="/" class="nav-link">Home</a></li>
          <li><a href="/firmware" class="nav-link">Firmware</a></li>
          <li><a href="/devices" class="nav-link">Devices</a></li>
          <li><a href="/projects" class="nav-link active">Projects</a></li>
        </ul>
      </div>
    </div>

    <div class="container">
      <div class="actions" style="margin-bottom: 1.5rem;">
        <button class="btn btn-secondary" onclick="window.router.navigate('/projects')">← Back to Projects</button>
        <button class="btn btn-primary" onclick="window.router.navigate('/project/telemetry?id=${project.project_id}')">View All Telemetry</button>
      </div>

      <div class="page-header">
        <h1 class="page-title">${project.project_name}</h1>
        <p class="page-description">
          <span class="badge badge-info">Water Pump</span>
          Project ID: ${project.project_id} | ${telemetryCount || 0} total samples
        </p>
      </div>

      <div class="card">
        <h2 class="card-title">Connected Devices</h2>
        ${devices && devices.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Device ID</th>
                  <th>Role</th>
                  <th>Auto Update</th>
                  <th>Tank Shape</th>
                  <th>Dimensions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${devices.map(device => `
                  <tr>
                    <td style="font-family: monospace;">${device.device_id}</td>
                    <td><span class="badge ${device.role === 'beta' ? 'badge-warning' : 'badge-secondary'}">${device.role}</span></td>
                    <td>${device.auto_update ? '✓' : '✗'}</td>
                    <td>${device.tank_shape || 'N/A'}</td>
                    <td>${device.height_cm ? `H: ${device.height_cm}cm` : ''} ${device.width_cm ? `W: ${device.width_cm}cm` : ''}</td>
                    <td>
                      <button class="btn btn-small btn-secondary" onclick="window.router.navigate('/device/telemetry?id=${device.device_id}')">View</button>
                      <button class="btn btn-small btn-primary" onclick="window.router.navigate('/device/edit?id=${device.device_id}')">Edit</button>
                      <button class="btn btn-small btn-danger" onclick="deleteDevice('${device.device_id}')">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📱</div>
            <p>No devices connected to this project</p>
          </div>
        `}
      </div>

    </div>
  `;

  window.updateActiveNav('projects');
}

window.deleteDevice = async function(deviceId) {
  if (!confirm('Delete this device? This cannot be undone!')) return;

  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('device_id', deviceId);

  if (error) {
    showNotification('Error deleting device: ' + error.message, 'error');
    return;
  }

  showNotification('Device deleted successfully', 'success');
  window.location.reload();
};

