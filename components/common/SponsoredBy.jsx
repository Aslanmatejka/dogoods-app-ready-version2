import React from "react";
import { useNavigate } from "react-router-dom";

function SponsoredBy() {
  const navigate = useNavigate();

  return (
    <div className="w-full py-8 px-4 bg-white/70 rounded-2xl shadow-lg flex flex-col items-center mt-10">
      <h2 className="text-2xl font-bold text-green-700 mb-4">Sponsored By</h2>
      <p className="text-gray-600 text-center mb-6">
        Thank you to our amazing sponsors who support our mission
      </p>
      <button
        onClick={() => navigate('/sponsors')}
        className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
      >
        View All Sponsors
      </button>
    </div>
  );
}

export default SponsoredBy;
  
