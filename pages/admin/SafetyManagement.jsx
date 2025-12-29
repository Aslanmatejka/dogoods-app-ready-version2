import React, { useState, useEffect } from 'react';
import SafetyService from '../../utils/safetyService';
import { toast } from 'react-toastify';

/**
 * SafetyManagement Component
 * Admin dashboard for managing safety reports and user trust
 */
function SafetyManagement() {
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    loadData();
  }, [activeTab, filterStatus, filterSeverity]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, reportsData] = await Promise.all([
        SafetyService.getSafetyStatistics(),
        SafetyService.getSafetyReports(filterStatus, filterSeverity)
      ]);
      setStatistics(stats);
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to load safety data:', error);
      toast.error('Failed to load safety data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <i className="fas fa-shield-alt text-green-600 mr-3"></i>
          Safety & Trust Management
        </h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage community safety reports and user trust levels
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon="fa-flag"
            label="Pending Reports"
            value={statistics.pendingReports}
            color="red"
          />
          <StatCard
            icon="fa-exclamation-triangle"
            label="Critical Issues"
            value={statistics.criticalReports}
            color="orange"
          />
          <StatCard
            icon="fa-users"
            label="Trusted Users"
            value={statistics.trustedUsers}
            color="green"
          />
          <StatCard
            icon="fa-star"
            label="Avg Trust Score"
            value={statistics.averageTrustScore}
            color="blue"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <TabButton
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
            icon="fa-flag"
            label="Safety Reports"
            count={reports.length}
          />
          <TabButton
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            icon="fa-users"
            label="User Trust"
          />
          <TabButton
            active={activeTab === 'verification'}
            onClick={() => setActiveTab('verification')}
            icon="fa-check-circle"
            label="Verification"
          />
        </div>

        <div className="p-6">
          {activeTab === 'reports' && (
            <SafetyReportsTab
              reports={reports}
              loading={loading}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterSeverity={filterSeverity}
              setFilterSeverity={setFilterSeverity}
              onReload={loadData}
            />
          )}
          {activeTab === 'users' && <UserTrustTab />}
          {activeTab === 'verification' && <VerificationTab />}
        </div>
      </div>
    </div>
  );
}

/**
 * StatCard Component
 */
function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    red: 'from-red-500 to-orange-500',
    orange: 'from-orange-500 to-yellow-500',
    green: 'from-green-500 to-blue-500',
    blue: 'from-blue-500 to-indigo-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses[color]} text-white mb-3`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

/**
 * TabButton Component
 */
function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
        active
          ? 'border-green-500 text-green-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      <i className={`fas ${icon}`}></i>
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${
          active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * SafetyReportsTab Component
 */
function SafetyReportsTab({ reports, loading, filterStatus, setFilterStatus, filterSeverity, setFilterSeverity, onReload }) {
  const [selectedReport, setSelectedReport] = useState(null);

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      await SafetyService.updateReportStatus(reportId, newStatus);
      toast.success('Report status updated');
      onReload();
    } catch (error) {
      console.error('Failed to update report:', error);
      toast.error('Failed to update report status');
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onSelect={() => setSelectedReport(report)}
              onStatusChange={updateReportStatus}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-check-circle text-4xl mb-3 text-gray-400"></i>
          <p>No reports found</p>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onStatusChange={updateReportStatus}
          onReload={onReload}
        />
      )}
    </div>
  );
}

/**
 * ReportCard Component
 */
function ReportCard({ report, onSelect, onStatusChange }) {
  const severityColors = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    investigating: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium border ${severityColors[report.severity]}`}>
              {report.severity.toUpperCase()}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[report.status]}`}>
              {report.status}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(report.created_at).toLocaleString()}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">
            {report.report_type.replace(/_/g, ' ').toUpperCase()}
          </h4>
          <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
          <div className="mt-2 text-xs text-gray-500">
            Reported by: {report.reporter_email} | Against: {report.reported_user_email}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={onSelect}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ReportDetailModal Component
 */
function ReportDetailModal({ report, onClose, onStatusChange, onReload }) {
  const [notes, setNotes] = useState('');

  const handleAction = async (action) => {
    try {
      if (action === 'ban_user') {
        await SafetyService.banUser(report.reported_user_id, notes);
        toast.success('User has been banned');
      } else if (action === 'warn_user') {
        await SafetyService.warnUser(report.reported_user_id, notes);
        toast.success('Warning issued to user');
      }
      await onStatusChange(report.id, 'resolved');
      onReload();
      onClose();
    } catch (error) {
      console.error('Failed to perform action:', error);
      toast.error('Failed to perform action');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Safety Report Details</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Report Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium">{report.report_type}</span>
              </div>
              <div>
                <span className="text-gray-600">Severity:</span>
                <span className="ml-2 font-medium">{report.severity}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{report.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2">{new Date(report.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{report.description}</p>
          </div>

          {report.evidence_urls && report.evidence_urls.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Evidence</h3>
              <div className="grid grid-cols-3 gap-2">
                {report.evidence_urls.map((url, index) => (
                  <img key={index} src={url} alt={`Evidence ${index + 1}`} className="w-full h-24 object-cover rounded" />
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Admin Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Add internal notes about this report..."
            />
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t">
            <div className="flex gap-2">
              <button
                onClick={() => onStatusChange(report.id, 'investigating')}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                Mark Investigating
              </button>
              <button
                onClick={() => onStatusChange(report.id, 'dismissed')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Dismiss
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('warn_user')}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
              >
                Warn User
              </button>
              <button
                onClick={() => handleAction('ban_user')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * UserTrustTab Component
 */
function UserTrustTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await SafetyService.getUsersByTrustLevel();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">User Trust Levels</h3>
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trust Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Safety Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warnings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.trust_score}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.safety_rating?.toFixed(1)} / 5.0</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.total_reviews || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.safety_warnings || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-2">View</button>
                    <button className="text-orange-600 hover:text-orange-800">Adjust</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * VerificationTab Component
 */
function VerificationTab() {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">User Verification</h3>
      <p className="text-gray-600">Verification management coming soon...</p>
    </div>
  );
}

export default SafetyManagement;
