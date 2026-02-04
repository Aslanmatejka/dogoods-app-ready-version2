import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/common/Button";

// Calculate next Friday from today
const getNextFriday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
    
    let daysUntilFriday;
    if (dayOfWeek <= 5) {
        // If today is Sunday-Friday, get this Friday
        daysUntilFriday = 5 - dayOfWeek;
    } else {
        // If today is Saturday, get next Friday (6 days away)
        daysUntilFriday = 6;
    }
    
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    
    // Format as "Month dd"
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return `${months[nextFriday.getMonth()]} ${nextFriday.getDate()}`;
};

export default function ClaimFoodForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const food = location.state?.food;
    const pickupDeadline = getNextFriday();

    if (!food) {
        return (
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <i className="fas fa-exclamation-triangle text-yellow-600 text-3xl mb-3"></i>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Food Selected</h2>
                    <p className="text-gray-600 mb-4">Please select a food item from the Find Food page.</p>
                    <Button onClick={() => navigate("/find")}>Go to Find Food</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Button 
                    onClick={() => navigate("/find")}
                    variant="secondary"
                    className="mb-4"
                >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Back to Find Food
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Claim Food</h1>
                <p className="text-gray-600">Review the details below and confirm your claim</p>
            </div>

            {/* Food Details Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    <i className="fas fa-utensils text-[#2CABE3] mr-3"></i>
                    Food Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Food Image */}
                    <div>
                        {food.image_url ? (
                            <img 
                                src={food.image_url} 
                                alt={food.title || food.name}
                                className="w-full h-64 object-cover rounded-lg shadow-md"
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                                <i className="fas fa-image text-gray-400 text-5xl"></i>
                            </div>
                        )}
                    </div>

                    {/* Food Information */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {food.title || food.name || "Food Item"}
                            </h3>
                            <p className="text-gray-600">{food.description || "No description available"}</p>
                        </div>

                        <div className="border-t border-gray-200 pt-4 space-y-3">
                            <div className="flex items-center">
                                <i className="fas fa-box text-[#2CABE3] w-6"></i>
                                <span className="text-gray-700 font-medium">Quantity:</span>
                                <span className="ml-2 text-gray-900">
                                    {food.quantity || "N/A"} {food.unit || ""}
                                </span>
                            </div>

                            <div className="flex items-center">
                                <i className="fas fa-calendar-alt text-[#2CABE3] w-6"></i>
                                <span className="text-gray-700 font-medium">Expiration Date:</span>
                                <span className="ml-2 text-gray-900">
                                    {food.expiry_date ? new Date(food.expiry_date).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    }) : "Not specified"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* School Location Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    <i className="fas fa-school text-[#2CABE3] mr-3"></i>
                    Pickup Location
                </h2>
                
                <div className="space-y-3">
                    <div>
                        <span className="text-gray-700 font-medium">School Name:</span>
                        <p className="text-lg text-gray-900">Lincoln Elementary School</p>
                    </div>
                    
                    <div>
                        <span className="text-gray-700 font-medium">Address:</span>
                        <p className="text-lg text-gray-900">123 Main Street</p>
                        <p className="text-lg text-gray-900">Alameda, CA 94501</p>
                    </div>
                </div>
            </div>

            {/* Pickup Windows Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    <i className="fas fa-clock text-[#2CABE3] mr-3"></i>
                    Pickup Windows
                </h2>
                
                <div className="space-y-3">
                    <div className="flex items-start">
                        <i className="fas fa-calendar-day text-[#2CABE3] mt-1 mr-3"></i>
                        <div>
                            <span className="font-semibold text-gray-900">Tuesday</span>
                            <p className="text-gray-700">2:00 PM - 3:30 PM</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start">
                        <i className="fas fa-calendar-day text-[#2CABE3] mt-1 mr-3"></i>
                        <div>
                            <span className="font-semibold text-gray-900">Thursday</span>
                            <p className="text-gray-700">2:00 PM - 3:30 PM</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start">
                        <i className="fas fa-calendar-day text-[#2CABE3] mt-1 mr-3"></i>
                        <div>
                            <span className="font-semibold text-gray-900">Friday</span>
                            <p className="text-gray-700">7:00 AM - 8:00 AM, 2:00 PM - 3:30 PM</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deadline Warning */}
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 mb-6">
                <div className="flex items-start">
                    <i className="fas fa-exclamation-triangle text-red-600 text-2xl mt-1 mr-4"></i>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-900 mb-2">Important Pickup Deadline</h3>
                        <p className="text-red-800 leading-relaxed">
                            Your food must be picked up by <strong>Friday, {pickupDeadline} at 3:30 PM</strong> or it will be marked as unclaimed and added back into inventory for other people to access. You may re-submit your claim if you miss the latest pick-up window.
                        </p>
                    </div>
                </div>
            </div>

            {/* Confirm Claim Button */}
            <div className="flex justify-center">
                <Button 
                    variant="primary" 
                    className="px-12 py-4 text-lg font-semibold bg-[#2CABE3] hover:opacity-90"
                    onClick={() => {
                        // TODO: Implement claim confirmation logic
                        alert('Claim confirmed! (Logic to be implemented)');
                    }}
                >
                    <i className="fas fa-check-circle mr-2"></i>
                    Confirm Claim
                </Button>
            </div>
        </div>
    );
}
