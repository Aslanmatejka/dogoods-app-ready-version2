import React from 'react';
import AdminLayout from './AdminLayout';
import Button from '../../components/common/Button';
import supabase from '../../utils/supabaseClient';
import { useAuthContext } from '../../utils/AuthContext';

function ImpactDataEntry() {
    const { user } = useAuthContext();
    const [data, setData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    // Use refs for uncontrolled inputs instead of state
    const newRowRefs = React.useRef({
        date: null,
        food_saved_kg: null,
        people_helped: null,
        meals_provided: null,
        partner_organizations: null,
        waste_diverted_kg: null,
        co2_reduced_kg: null,
        volunteer_hours: null,
        notes: null
    });

    React.useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: impactData, error } = await supabase
                .from('impact_data')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setData(impactData || []);
        } catch (error) {
            console.error('Error fetching impact data:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = async () => {
        try {
            // Get values from refs (uncontrolled inputs)
            const newRowData = {
                date: newRowRefs.current.date?.value || new Date().toISOString().split('T')[0],
                food_saved_kg: newRowRefs.current.food_saved_kg?.value || 0,
                people_helped: newRowRefs.current.people_helped?.value || 0,
                meals_provided: newRowRefs.current.meals_provided?.value || 0,
                partner_organizations: newRowRefs.current.partner_organizations?.value || 0,
                waste_diverted_kg: newRowRefs.current.waste_diverted_kg?.value || 0,
                co2_reduced_kg: newRowRefs.current.co2_reduced_kg?.value || 0,
                volunteer_hours: newRowRefs.current.volunteer_hours?.value || 0,
                notes: newRowRefs.current.notes?.value || '',
                created_by: user?.id
            };

            const { error } = await supabase
                .from('impact_data')
                .insert([newRowData]);

            if (error) throw error;

            // Clear input fields
            if (newRowRefs.current.date) newRowRefs.current.date.value = new Date().toISOString().split('T')[0];
            if (newRowRefs.current.food_saved_kg) newRowRefs.current.food_saved_kg.value = '';
            if (newRowRefs.current.people_helped) newRowRefs.current.people_helped.value = '';
            if (newRowRefs.current.meals_provided) newRowRefs.current.meals_provided.value = '';
            if (newRowRefs.current.partner_organizations) newRowRefs.current.partner_organizations.value = '';
            if (newRowRefs.current.waste_diverted_kg) newRowRefs.current.waste_diverted_kg.value = '';
            if (newRowRefs.current.co2_reduced_kg) newRowRefs.current.co2_reduced_kg.value = '';
            if (newRowRefs.current.volunteer_hours) newRowRefs.current.volunteer_hours.value = '';
            if (newRowRefs.current.notes) newRowRefs.current.notes.value = '';

            await fetchData();
        } catch (error) {
            console.error('Error adding row:', error);
            alert('Failed to add row: ' + error.message);
        }
    };

    const handleUpdateRow = async (id, field, value) => {
        try {
            const { error } = await supabase
                .from('impact_data')
                .update({
                    [field]: value,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // Update local data after successful save
            setData(prev => prev.map(row =>
                row.id === id ? { ...row, [field]: value } : row
            ));
        } catch (error) {
            console.error('Error updating row:', error);
            alert('Failed to update: ' + error.message);
        }
    };

    const handleDeleteRow = async (id) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;

        try {
            const { error } = await supabase
                .from('impact_data')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchData();
        } catch (error) {
            console.error('Error deleting row:', error);
            alert('Failed to delete: ' + error.message);
        }
    };

    // Simple update handler for existing rows - uses uncontrolled inputs too

    const exportToCSV = () => {
        const headers = ['Date', 'Food Saved (Lb)', 'People Helped', 'Meals Provided', 'Partner Orgs', 'Waste Diverted (Lb)', 'CO2 Reduced (Lb)', 'Volunteer Hours', 'Notes'];

        const rows = data.map(row => [
            row.date,
            row.food_saved_kg,
            row.people_helped,
            row.meals_provided || 0,
            row.partner_organizations || 0,
            row.waste_diverted_kg || 0,
            row.co2_reduced_kg || 0,
            row.volunteer_hours || 0,
            row.notes || ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `impact_data_${new Date().toISOString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Uncontrolled input component - no state, no re-renders
    const UncontrolledCell = ({ defaultValue, onBlur, type = 'text', inputRef }) => {
        return (
            <input
                ref={inputRef}
                type={type}
                defaultValue={defaultValue}
                onBlur={(e) => {
                    const value = type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value;
                    onBlur(value);
                }}
                className="w-full px-2 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
        );
    };

    return (
        <AdminLayout active="impact">
            <div className="p-6">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Impact Data Entry</h1>
                        <p className="mt-2 text-gray-600">Manually enter and manage impact metrics</p>
                    </div>
                    <div className="flex space-x-3">
                        <Button
                            variant="secondary"
                            onClick={fetchData}
                        >
                            <i className="fas fa-sync-alt mr-2"></i>
                            Refresh
                        </Button>
                        <Button
                            variant="primary"
                            onClick={exportToCSV}
                        >
                            <i className="fas fa-download mr-2"></i>
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Quick Entry Form */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <i className="fas fa-plus-circle text-green-600 mr-2"></i>
                        Quick Impact Entry
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date *
                            </label>
                            <input
                                type="date"
                                ref={el => newRowRefs.current.date = el}
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Food Saved/Provided (LB)
                            </label>
                            <input
                                type="number"
                                ref={el => newRowRefs.current.food_saved_kg = el}
                                placeholder="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                People Helped
                            </label>
                            <input
                                type="number"
                                ref={el => newRowRefs.current.people_helped = el}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meals Provided
                            </label>
                            <input
                                type="number"
                                ref={el => newRowRefs.current.meals_provided = el}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Partner Organizations
                            </label>
                            <input
                                type="number"
                                ref={el => newRowRefs.current.partner_organizations = el}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Includes schools, non-profits, etc.</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Waste Diverted (LB)
                            </label>
                            <input
                                type="number"
                                ref={el => newRowRefs.current.waste_diverted_kg = el}
                                placeholder="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CO2 Reduced (LB)
                            </label>
                            <input
                                type="number"
                                ref={el => newRowRefs.current.co2_reduced_kg = el}
                                placeholder="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Volunteer Hours
                            </label>
                            <input
                                type="number"
                                ref={el => newRowRefs.current.volunteer_hours = el}
                                placeholder="0"
                                step="0.5"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div className="md:col-span-2 lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <input
                                type="text"
                                ref={el => newRowRefs.current.notes = el}
                                placeholder="Optional notes..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                        <Button
                            variant="primary"
                            onClick={handleAddRow}
                            size="lg"
                        >
                            <i className="fas fa-plus-circle mr-2"></i>
                            Add Impact Record
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading data...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                                        Date
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                        Food (LB)
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                        People
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                        Meals
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                        Partners
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                        Waste (LB)
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                        CO2 (LB)
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                                        Vol. Hrs
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                        Notes
                                    </th>
                                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr className="bg-green-50">
                                    <td className="px-2 py-2">
                                        <UncontrolledCell
                                            type="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            inputRef={el => newRowRefs.current.date = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.food_saved_kg = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.people_helped = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.meals_provided = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.partner_organizations = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.waste_diverted_kg = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.co2_reduced_kg = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.volunteer_hours = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <UncontrolledCell
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.notes = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleAddRow}
                                        >
                                            <i className="fas fa-plus"></i>
                                        </Button>
                                    </td>
                                </tr>

                                {data.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="px-2 py-2">
                                            <UncontrolledCell
                                                type="date"
                                                defaultValue={row.date}
                                                onBlur={(val) => handleUpdateRow(row.id, 'date', val)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.food_saved_kg}
                                                onBlur={(val) => handleUpdateRow(row.id, 'food_saved_kg', val)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.people_helped}
                                                onBlur={(val) => handleUpdateRow(row.id, 'people_helped', val)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.meals_provided || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'meals_provided', val)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.partner_organizations || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'partner_organizations', val)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.waste_diverted_kg || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'waste_diverted_kg', val)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.co2_reduced_kg || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'co2_reduced_kg', val)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.volunteer_hours || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'volunteer_hours', val)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <UncontrolledCell
                                                defaultValue={row.notes || ''}
                                                onBlur={(val) => handleUpdateRow(row.id, 'notes', val)}
                                            />
                                        </td>
                                        <td className="px-2 py-2">\n                                            <Button\n                                                variant="danger"\n                                                size="sm"\n                                                onClick={() => handleDeleteRow(row.id)}\n                                            >
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}

                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No data entries yet. Add your first entry using the row above.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                        <i className="fas fa-info-circle mr-2"></i>
                        How to use this spreadsheet
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Fill in the green row at the top to add a new entry</li>
                        <li>• Click the + button to save the new entry</li>
                        <li>• Click on any cell to edit existing data</li>
                        <li>• Changes are saved automatically when you click outside the cell</li>
                        <li>• Use the trash icon to delete an entry</li>
                        <li>• Export to CSV for backup or further analysis</li>
                    </ul>
                </div>
            </div>
        </AdminLayout>
    );
}

export default ImpactDataEntry;
