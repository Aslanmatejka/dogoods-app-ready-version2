import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabaseClient';
import { toast } from 'react-toastify';

function ImpactContentManagement() {
    const [activeTab, setActiveTab] = useState('testimonials');
    const [stories, setStories] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Map tab to story type for the 3 story tabs
    const tabToStoryType = {
        'testimonials': 'testimonial',
        'blog': 'featured',
        'news': 'news'
    };

    // Tab display labels
    const tabLabels = {
        'testimonials': 'Testimonials',
        'blog': 'Blog',
        'news': 'News/Updates',
        'gallery': 'Gallery'
    };

    // Helper: is this a story-type tab?
    const isStoryTab = (tab) => ['testimonials', 'blog', 'news'].includes(tab);

    // Filter stories by type for the active tab
    const getFilteredStories = (tab) => {
        const type = tabToStoryType[tab];
        return stories.filter(s => s.type === type);
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [storiesRes, galleryRes] = await Promise.all([
                supabase.from('impact_stories').select('*').order('display_order'),
                supabase.from('impact_gallery').select('*').order('display_order')
            ]);
            if (storiesRes.error) throw storiesRes.error;
            if (galleryRes.error) throw galleryRes.error;
            setStories(storiesRes.data || []);
            setGallery(galleryRes.data || []);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        const newItem = getEmptyItem();
        setEditingItem(newItem);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditingItem({ ...item });
        setShowModal(true);
    };

    const handleDelete = async (id, table) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            toast.success('Item deleted successfully');
            loadAllData();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Failed to delete item');
        }
    };

    const handleSave = async () => {
        try {
            const table = getTableName();
            // eslint-disable-next-line no-unused-vars
            const { id, created_at, updated_at, created_by, ...itemData } = editingItem;
            
            if (id) {
                // Update existing
                const { error } = await supabase
                    .from(table)
                    .update({ ...itemData, updated_at: new Date().toISOString() })
                    .eq('id', id);
                if (error) throw error;
                toast.success('Item updated successfully');
            } else {
                // Create new
                const { data: { user } } = await supabase.auth.getUser();
                const { error } = await supabase
                    .from(table)
                    .insert([{ ...itemData, created_by: user?.id }]);
                if (error) throw error;
                toast.success('Item created successfully');
            }
            
            setShowModal(false);
            setEditingItem(null);
            loadAllData();
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Failed to save item');
        }
    };

    const toggleActive = async (id, isActive, table) => {
        try {
            const { error } = await supabase
                .from(table)
                .update({ is_active: !isActive })
                .eq('id', id);
            
            if (error) throw error;
            toast.success(isActive ? 'Item hidden' : 'Item activated');
            loadAllData();
        } catch (error) {
            console.error('Error toggling active:', error);
            toast.error('Failed to update status');
        }
    };

    const getTableName = () => {
        if (isStoryTab(activeTab)) return 'impact_stories';
        return 'impact_gallery';
    };

    const getEmptyItem = () => {
        if (isStoryTab(activeTab)) {
            const base = {
                type: tabToStoryType[activeTab],
                title: '',
                quote: '',
                attribution: '',
                organization: '',
                display_order: 0,
                is_active: true
            };
            // Only include image_url for non-testimonial story types
            if (activeTab !== 'testimonials') {
                base.image_url = '';
            }
            return base;
        } else if (activeTab === 'gallery') {
            return {
                title: '',
                description: '',
                image_url: '',
                category: '',
                display_order: 0,
                is_active: true
            };
        } else {
            return {
                title: '',
                description: '',
                image_url: '',
                category: '',
                display_order: 0,
                is_active: true
            };
        }
    };

    const renderStoryForm = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700">
                    {tabLabels[activeTab]}
                </div>
                <input type="hidden" value={editingItem?.type || tabToStoryType[activeTab]} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                    type="text"
                    value={editingItem?.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quote/Content</label>
                <textarea
                    value={editingItem?.quote || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, quote: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg"
                />
            </div>
            {activeTab !== 'testimonials' && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                    type="text"
                    value={editingItem?.image_url || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                />
            </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attribution</label>
                    <input
                        type="text"
                        value={editingItem?.attribution || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, attribution: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    <input
                        type="text"
                        value={editingItem?.organization || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, organization: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input
                        type="number"
                        value={editingItem?.display_order || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, display_order: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <div className="flex items-center pt-6">
                    <input
                        type="checkbox"
                        checked={editingItem?.is_active || false}
                        onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                        className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
            </div>
        </div>
    );

    const renderGalleryForm = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                    type="text"
                    value={editingItem?.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    value={editingItem?.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                    type="text"
                    value={editingItem?.image_url || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                        type="text"
                        value={editingItem?.category || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                    <input
                        type="number"
                        value={editingItem?.display_order || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, display_order: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <div className="flex items-center pt-6">
                    <input
                        type="checkbox"
                        checked={editingItem?.is_active || false}
                        onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                        className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Impact Content Management</h1>
                <p className="text-gray-600">Create and manage testimonials, blog posts, news, and gallery items</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 mb-6 border-b">
                {['testimonials', 'blog', 'news', 'gallery'].map((tab) => {
                    const count = tab === 'gallery' ? gallery.length
                        : getFilteredStories(tab).length;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-3 font-semibold text-sm ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                            {tabLabels[tab]} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Action Button */}
            <button
                onClick={handleCreate}
                className="mb-6 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
                + Create New {tabLabels[activeTab]} Item
            </button>

            {/* List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {isStoryTab(activeTab) && getFilteredStories(activeTab).map((story) => (
                        <div key={story.id} className="bg-white p-6 rounded-lg shadow border">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">{tabLabels[activeTab]}</span>
                                        {!story.is_active && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Hidden</span>}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{story.title}</h3>
                                    <p className="text-gray-600 mb-2 line-clamp-2">{story.quote}</p>
                                    <p className="text-sm text-gray-500">— {story.attribution}, {story.organization}</p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => toggleActive(story.id, story.is_active, 'impact_stories')}
                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                                    >
                                        {story.is_active ? 'Hide' : 'Show'}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(story)}
                                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-sm text-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(story.id, 'impact_stories')}
                                        className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {activeTab === 'gallery' && gallery.map((item) => (
                        <div key={item.id} className="bg-white p-6 rounded-lg shadow border flex gap-4">
                            <img src={item.image_url} alt={item.title} className="w-32 h-32 object-cover rounded-lg" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {item.category && <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">{item.category}</span>}
                                            {!item.is_active && <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Hidden</span>}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                        <p className="text-gray-600">{item.description}</p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => toggleActive(item.id, item.is_active, 'impact_gallery')}
                                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                                        >
                                            {item.is_active ? 'Hide' : 'Show'}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-sm text-blue-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, 'impact_gallery')}
                                            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm text-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            {editingItem?.id ? 'Edit' : 'Create'} {tabLabels[activeTab]}
                        </h2>
                        
                        {isStoryTab(activeTab) && renderStoryForm()}
                        {activeTab === 'gallery' && renderGalleryForm()}
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingItem(null);
                                }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImpactContentManagement;
