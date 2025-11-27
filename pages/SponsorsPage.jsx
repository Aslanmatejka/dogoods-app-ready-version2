import React from "react";
import cheeseBoard from "./sponsoredby/cheese_board.png";
import community from "./sponsoredby/community.png";
import farm from "./sponsoredby/farm.png";
import feedingElmeda from "./sponsoredby/feeding_elmeda.png";
import feelGoodBakery from "./sponsoredby/feel_good_backery.png";
import shareChicken from "./sponsoredby/sharechicken.png";
import sharePizza from "./sponsoredby/sharepizza.png";
import aclc from "./sponsoredby/ACLC.jpg";
import allGoodLiving from "./sponsoredby/allgoodliving.jpg";
import island from "./sponsoredby/island.jpg";
import jets from "./sponsoredby/jets.jpg";
import ruby from "./sponsoredby/Ruby.jpg";
import theAcademy from "./sponsoredby/the academy.jpg";
import foodrecovery from "./sponsoredby/foodrecovery.png";
import foodshift from "./sponsoredby/foodshift.png";

const sponsors = [
  {
    name: "The Cheese Board Collective",
    img: cheeseBoard,
    website: "https://cheeseboardcollective.coop/",
    description: "A worker-owned cooperative bakery and pizzeria in Berkeley"
  },
  {
    name: "Alameda County Community Food Bank",
    img: community,
    website: "https://www.accfb.org/",
    description: "Distributing nutritious food to people in need throughout Alameda County"
  },
  {
    name: "Berkeley Student Food Collective",
    img: farm,
    website: "https://www.berkeleysfc.org/",
    description: "Student-run organization providing fresh, local, and organic food"
  },
  {
    name: "Feeding Alameda County",
    img: feedingElmeda,
    website: "https://www.accfb.org/",
    description: "Working to end hunger in Alameda County"
  },
  {
    name: "Community Kitchen",
    img: shareChicken,
    website: "#",
    description: "Providing nutritious meals to community members in need"
  },
  {
    name: "Berkeley Pizza Collective",
    img: sharePizza,
    website: "#",
    description: "Community-focused pizzeria supporting local food access"
  },
  {
    name: "Food shift",
    img: foodshift,
    website: "https://foodshift.net",
    description: ""
  },
  {
    name: "Food recovery",
    image: foodrecovery,
    website: "https//foodrecovery.org";
    description: ""
  }
];

function SponsorsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Sponsors</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We are grateful for the support of these amazing organizations that help make DoGoods possible.
            Their commitment to food security and community building aligns perfectly with our mission.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.name}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <div className="h-48 bg-gray-100 flex items-center justify-center p-6">
                <img
                  src={sponsor.img}
                  alt={sponsor.name + ' logo'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {sponsor.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {sponsor.description}
                </p>
                {sponsor.website && sponsor.website !== "#" && (
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Visit Website
                    <i className="fas fa-external-link-alt ml-2 text-xs"></i>
                  </a>
                )}
                {sponsor.website === "#" && (
                  <span className="text-gray-400 text-sm">
                    Website coming soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Become a Sponsor
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Interested in supporting our mission to reduce food waste and strengthen communities?
            We'd love to partner with you!
          </p>
          <a
            href="mailto:sponsors@dogoods.org"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
          >
            Contact Us About Sponsorship
          </a>
        </div>
      </div>
    </div>
  );
}

export default SponsorsPage;
