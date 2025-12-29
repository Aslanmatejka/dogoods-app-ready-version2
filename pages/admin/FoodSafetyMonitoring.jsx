import React, { useState, useEffect } from 'react';
import FoodSafetyService from '../../utils/foodSafetyService';
import { SafetyBadge } from '../food/FoodSafetyChecklist';
import { toast } from 'react-toastify';

/**
 * FoodSafetyMonitoring Component
 * Admin dashboard for monitoring food safety compliance
 */
function FoodSafetyMonitoring() {
  const [statistics, setStatistics] = useState(null);
  const [violations, setViolations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const stats = await FoodSafetyService.getSafetyStatistics();
      setStatistics(stats);
      
      // Load unresolved violations
      const { data } = await supabase
        .from('food_safety_violations')
        .select('*, listing:listing_id(title, user_id)')
        .eq('resolved', false)
        .order('created_at', { ascending: false });
      
      setViolations(data || []);
    } catch (error) {
      console.error('Failed to load safety data:', error);
      toast.error('Failed to load safety monitoring data');
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
          Food Safety Monitoring
        </h1>
        <p className="text-gray-600 mt-1">
          Monitor food safety compliance and violations across all listings
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon="fa-clipboard-check"
            label="Total Safety Checks"
            value={statistics.totalChecks}
            color="blue"
            subtitle={`${statistics.passedChecks} passed`}
          />
          <StatCard
            icon="fa-star"
            label="Avg Safety Score"
            value={statistics.averageSafetyScore}
            color="green"
            subtitle="Out of 100"
          />
          <StatCard
            icon="fa-exclamation-triangle"
            label="Active Violations"
            value={statistics.unresolvedViolations}
            color="orange"
            subtitle={`${statistics.criticalViolations} critical`}
          />
          <StatCard
            icon="fa-check-circle"
            label="Safe Listings"
            value={`${statistics.safeListings}/${statistics.totalListings}`}
            color="green"
            subtitle={`${((statistics.safeListings / statistics.totalListings) * 100).toFixed(0)}% safe`}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon="fa-chart-bar"
            label="Overview"
          />
          <TabButton
            active={activeTab === 'violations'}
            onClick={() => setActiveTab('violations')}
            icon="fa-exclamation-triangle"
            label="Violations"
            count={statistics?.unresolvedViolations}
          />
          <TabButton
            active={activeTab === 'checks'}
            onClick={() => setActiveTab('checks')}
            icon="fa-clipboard-list"
            label="Safety Checks"
          />
          <TabButton
            active={activeTab === 'compliance'}
            onClick={() => setActiveTab('compliance')}
            icon="fa-tasks"
            label="Compliance"
          />
        </div>

        <div className="p-6">
          {activeTab === 'overview' && statistics && (
            <OverviewTab statistics={statistics} />
          )}
          {activeTab === 'violations' && (
            <ViolationsTab violations={violations} onReload={loadData} />
          )}
          {activeTab === 'checks' && <SafetyChecksTab />}
          {activeTab === 'compliance' && <ComplianceTab />}
        </div>
      </div>
    </div>
  );
}

/**
 * StatCard Component
 */
function StatCard({ icon, label, value, color, subtitle }) {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-500',
    green: 'from-green-500 to-blue-500',
    orange: 'from-orange-500 to-red-500',
    red: 'from-red-500 to-pink-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses[color]} text-white mb-3`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
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
 * OverviewTab Component
 */
function OverviewTab({ statistics }) {
  return (
    <div className="space-y-6">
      {/* Storage Breakdown */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Storage Type Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(statistics.storageBreakdown).map(([type, count]) => (
            <div key={type} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-600 capitalize">{type.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Metrics */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Safety Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            label="Compliance Rate"
            value={`${((statistics.safeListings / statistics.totalListings) * 100).toFixed(1)}%`}
            trend="+5%"
            trendUp={true}
          />
          <MetricCard
            label="Avg Safety Score"
            value={statistics.averageSafetyScore}
            trend="+2.3"
            trendUp={true}
          />
          <MetricCard
            label="Violation Rate"
            value={`${((statistics.totalViolations / statistics.totalListings) * 100).toFixed(1)}%`}
            trend="-1.5%"
            trendUp={true}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex">
          <i className="fas fa-info-circle text-blue-600 mt-0.5 mr-3"></i>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Food Safety Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All food must pass safety checks before listing</li>
              <li>• Temperature must be monitored for perishable items</li>
              <li>• Expired food cannot be listed</li>
              <li>• Proper packaging is required for all items</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ViolationsTab Component
 */
function ViolationsTab({ violations, onReload }) {
  const [selectedViolation, setSelectedViolation] = useState(null);

  const resolveViolation = async (violationId) => {
    try {
      const { error } = await supabase
        .from('food_safety_violations')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', violationId);

      if (error) throw error;
      toast.success('Violation marked as resolved');
      onReload();
    } catch (error) {
      console.error('Failed to resolve violation:', error);
      toast.error('Failed to resolve violation');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Active Violations</h3>
        <button
          onClick={onReload}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh
        </button>
      </div>

      {violations.length > 0 ? (
        <div className="space-y-3">
          {violations.map((violation) => (
            <ViolationCard
              key={violation.id}
              violation={violation}
              onResolve={() => resolveViolation(violation.id)}
              onViewDetails={() => setSelectedViolation(violation)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-check-circle text-4xl mb-3 text-green-400"></i>
          <p>No active violations</p>
        </div>
      )}
    </div>
  );
}

/**
 * ViolationCard Component
 */
function ViolationCard({ violation, onResolve, onViewDetails }) {
  const severityColors = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium border ${severityColors[violation.severity]}`}>
              {violation.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(violation.created_at).toLocaleString()}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">
            {violation.violation_type.replace(/_/g, ' ').toUpperCase()}
          </h4>
          <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
          {violation.listing && (
            <p className="text-xs text-gray-500">
              Listing: {violation.listing.title}
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={onViewDetails}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Details
          </button>
          <button
            onClick={onResolve}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * SafetyChecksTab Component
 */
function SafetyChecksTab() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecks();
  }, []);

  const loadChecks = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('food_safety_checks')
        .select('*, listing:listing_id(title), checker:checker_id(email)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      setChecks(data || []);
    } catch (error) {
      console.error('Failed to load checks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Safety Checks</h3>
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </div>
      ) : checks.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {checks.map((check) => (
                <tr key={check.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {check.listing?.title || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {check.checker?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {check.check_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SafetyBadge score={check.safety_score} size="sm" showLabel={false} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      check.overall_safe
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {check.overall_safe ? 'Passed' : 'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(check.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No safety checks found</p>
        </div>
      )}
    </div>
  );
}

/**
 * ComplianceTab Component
 */
function ComplianceTab() {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">Compliance Overview</h3>
      <p className="text-gray-600">Compliance tracking coming soon...</p>
    </div>
  );
}

/**
 * MetricCard Component
 */
function MetricCard({ label, value, trend, trendUp }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {trend && (
        <div className={`text-sm flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          <i className={`fas fa-arrow-${trendUp ? 'up' : 'down'}`}></i>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

export default FoodSafetyMonitoring;
