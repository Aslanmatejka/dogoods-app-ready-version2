import React from 'react';
import AdminLayout from './AdminLayout';
import supabase from '../../utils/supabaseClient';
import Button from '../../components/common/Button';

const CommunityManagement = () => {
  const [communities, setCommunities] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editingCommunity, setEditingCommunity] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    location: '',
    contact: '',
    phone: '',
    image: '',
    is_active: true
  });

  React.useEffect(() => {
    fetchCommunities();

    const subscription = supabase
      .channel('community-management')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communities'
        },
        () => {
          console.log('Community data changed, refreshing...');
          fetchCommunities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
      setCommunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (submitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    setSubmitting(true);
    console.log('Submitting community data:', formData);
    
    try {
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'Authenticated' : 'Not authenticated');
      
      if (!session) {
        throw new Error('You must be logged in to add/edit communities. Please log in to the admin panel.');
      }
      
      if (editingCommunity) {
        // Update existing community
        console.log('Updating community ID:', editingCommunity.id);
        const { data, error } = await supabase
          .from('communities')
          .update(formData)
          .eq('id', editingCommunity.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Update successful:', data);
        alert('Community updated successfully!');
      } else {
        // Add new community
        console.log('Inserting new community...');
        const { data, error } = await supabase
          .from('communities')
          .insert([formData])
          .select();

        if (error) {
          console.error('Insert error:', error);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          throw new Error(`Database Error: ${error.message || 'Unknown error'}\nCode: ${error.code || 'N/A'}\nDetails: ${error.details || 'N/A'}\nHint: ${error.hint || 'N/A'}`);
        }
        console.log('Insert successful:', data);
        alert('Community added successfully!');
      }

      setShowModal(false);
      setEditingCommunity(null);
      setFormData({
        name: '',
        location: '',
        contact: '',
        phone: '',
        image: '',
        is_active: true
      });
      fetchCommunities();
    } catch (error) {
      console.error('Error saving community:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      alert('Failed to save community: ' + error.message + '\n\nCheck console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (community) => {
    setEditingCommunity(community);
    setFormData({
      name: community.name || '',
      location: community.location || '',
      contact: community.contact || '',
      phone: community.phone || '',
      image: community.image || '',
      is_active: community.is_active !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Community deleted successfully!');
      fetchCommunities();
    } catch (error) {
      console.error('Error deleting community:', error);
      alert('Failed to delete community: ' + error.message);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('communities')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchCommunities();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Failed to update active status');
    }
  };

  const handleAddNew = () => {
    setEditingCommunity(null);
    setFormData({
      name: '',
      location: '',
      contact: '',
      phone: '',
      image: '',
      is_active: true
    });
    setShowModal(true);
  };

  return (
    <AdminLayout active="communities">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            <i className="fas fa-users text-[#2CABE3] mr-3"></i>
            Community Management
          </h1>
          <Button onClick={handleAddNew}>
            <i className="fas fa-plus mr-2"></i>
            Add Community
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2CABE3] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading communities...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Community
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {communities.map((community) => (
                  <tr key={community.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {community.image && (
                          <img
                            src={community.image}
                            alt={community.name}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {community.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{community.location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{community.contact}</div>
                      <div className="text-sm text-gray-500">{community.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        community.is_active ? 'bg-[#2CABE3]/20 text-[#2CABE3]' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {community.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(community)}
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleActive(community.id, community.is_active)}
                      >
                        <i className={`fas fa-${community.is_active ? 'eye-slash' : 'eye'}`}></i>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDelete(community.id, community.name)}
                      >
                        <i className="fas fa-trash text-red-600"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-[#2CABE3] text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingCommunity ? 'Edit Community' : 'Add New Community'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-white hover:opacity-90">
                  <i className="fas fa-times text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Community Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2CABE3] focus:border-[#2CABE3]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2CABE3] focus:border-[#2CABE3]"
                    placeholder="e.g., 123 Main Street, Oakland, CA 94601"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2CABE3] focus:border-[#2CABE3]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2CABE3] focus:border-[#2CABE3]"
                    placeholder="(510) 123-4567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2CABE3] focus:border-[#2CABE3]"
                    placeholder="https://example.com/image.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a URL to a community logo or image
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#2CABE3] focus:ring-[#2CABE3] border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Active (visible to users)
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      editingCommunity ? 'Update Community' : 'Add Community'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CommunityManagement;
