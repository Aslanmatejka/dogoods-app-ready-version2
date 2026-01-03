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
        food_saved_from_waste_lb: null,
        food_provided_lb: null,
        people_helped: null,
        schools_served: null,
        nonprofits_helped: null,
        total_meals_provided: null,
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
                food_saved_from_waste_lb: newRowRefs.current.food_saved_from_waste_lb?.value || 0,
                food_provided_lb: newRowRefs.current.food_provided_lb?.value || 0,
                people_helped: newRowRefs.current.people_helped?.value || 0,
                schools_served: newRowRefs.current.schools_served?.value || 0,
                nonprofits_helped: newRowRefs.current.nonprofits_helped?.value || 0,
                total_meals_provided: newRowRefs.current.total_meals_provided?.value || 0,
                notes: newRowRefs.current.notes?.value || '',
                created_by: user?.id
            };

            const { error } = await supabase
                .from('impact_data')
                .insert([newRowData]);

            if (error) throw error;

            // Clear input fields
            if (newRowRefs.current.date) newRowRefs.current.date.value = new Date().toISOString().split('T')[0];
            if (newRowRefs.current.food_saved_from_waste_lb) newRowRefs.current.food_saved_from_waste_lb.value = '';
            if (newRowRefs.current.food_provided_lb) newRowRefs.current.food_provided_lb.value = '';
            if (newRowRefs.current.people_helped) newRowRefs.current.people_helped.value = '';
            if (newRowRefs.current.schools_served) newRowRefs.current.schools_served.value = '';
            if (newRowRefs.current.nonprofits_helped) newRowRefs.current.nonprofits_helped.value = '';
            if (newRowRefs.current.total_meals_provided) newRowRefs.current.total_meals_provided.value = '';
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
        const headers = ['Date', 'Food Saved from Waste (lb)', 'Food Provided (lb)', 'People Helped', 'Schools Served', 'Non-Profits Helped', 'Total Meals Provided', 'Notes'];

        const rows = data.map(row => [
            row.date,
            row.food_saved_from_waste_lb || 0,
            row.food_provided_lb || 0,
            row.people_helped || 0,
            row.schools_served || 0,
            row.nonprofits_helped || 0,
            row.total_meals_provided || 0,
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
                className="w-full px-4 py-6 text-2xl font-bold border-2 border-gray-400 rounded focus:outline-none focus:ring-4 focus:ring-green-500 focus:border-green-600 transition-all bg-white"
                style={{ minHeight: '80px', lineHeight: '1.2' }}
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
                                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-40">
                                        Date
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-bold text-green-600 uppercase tracking-wider w-36">
                                        Food Saved from Waste (lb)
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-bold text-green-600 uppercase tracking-wider w-36">
                                        Food Provided (lb)
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-bold text-green-600 uppercase tracking-wider w-32">
                                        People Helped
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider w-32">
                                        Schools Served
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-bold text-blue-600 uppercase tracking-wider w-32">
                                        Non-Profits Helped
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-bold text-purple-600 uppercase tracking-wider w-32">
                                        Total Meals
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-64">
                                        Notes
                                    </th>
                                    <th className="px-4 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider w-28">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr className="bg-green-50" style={{ height: '100px' }}>
                                    <td className="px-4 py-5">
                                        <UncontrolledCell
                                            type="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            inputRef={el => newRowRefs.current.date = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-4 py-5">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.food_saved_from_waste_lb = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-4 py-5">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.food_provided_lb = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-4 py-5">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.people_helped = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-4 py-5">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.schools_served = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-4 py-5">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.nonprofits_helped = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-4 py-5">
                                        <UncontrolledCell
                                            type="number"
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.total_meals_provided = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-4 py-5">
                                        <UncontrolledCell
                                            defaultValue=""
                                            inputRef={el => newRowRefs.current.notes = el}
                                            onBlur={() => { }}
                                        />
                                    </td>
                                    <td className="px-4 py-5">
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
                                    <tr key={row.id} className="hover:bg-gray-50" style={{ height: '100px' }}>
                                        <td className="px-4 py-5">
                                            <UncontrolledCell
                                                type="date"
                                                defaultValue={row.date}
                                                onBlur={(val) => handleUpdateRow(row.id, 'date', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-5">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.food_saved_from_waste_lb || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'food_saved_from_waste_lb', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-5">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.food_provided_lb || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'food_provided_lb', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-5">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.people_helped || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'people_helped', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-5">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.schools_served || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'schools_served', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-5">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.nonprofits_helped || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'nonprofits_helped', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-5">
                                            <UncontrolledCell
                                                type="number"
                                                defaultValue={row.total_meals_provided || 0}
                                                onBlur={(val) => handleUpdateRow(row.id, 'total_meals_provided', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-5">
                                            <UncontrolledCell
                                                defaultValue={row.notes || ''}
                                                onBlur={(val) => handleUpdateRow(row.id, 'notes', val)}
                                            />
                                        </td>
                                        <td className="px-4 py-5">
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDeleteRow(row.id)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}

                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
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
