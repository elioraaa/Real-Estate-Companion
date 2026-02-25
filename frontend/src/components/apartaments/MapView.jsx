import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { useNavigate } from "react-router-dom";
import { evaluateDeal } from "../../services/estimatorService";
import "./MapView.css";

// Tirana city center (Skanderbeg Square)
const TIRANA_CENTER = [41.3275, 19.8187];

function formatPrice(price) {
  if (price >= 1_000_000) return `€${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `€${Math.round(price / 1_000)}k`;
  return `€${price}`;
}

function createPriceIcon(price, isGoodDeal) {
  return L.divIcon({
    className: "",
    html: `<div class="map-price-label${isGoodDeal ? " map-price-label--deal" : ""}">${formatPrice(price)}</div>`,
    iconSize: [72, 26],
    iconAnchor: [36, 26],
    popupAnchor: [0, -28],
  });
}

// Imperative cluster layer — avoids rendering hundreds of React Marker nodes
function ClusterLayer({ apartments, estimatesById, navigate }) {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 60,
      disableClusteringAtZoom: 17,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          className: "",
          html: `<div class="map-cluster-icon">${count > 99 ? "99+" : count}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
      },
    });

    apartments.forEach((apartment) => {
      if (!apartment.lat || !apartment.lng) return;

      const id = apartment.id || apartment._id;
      const estimate = estimatesById?.[id];
      const deal = evaluateDeal(apartment.price, estimate?.estimatedPrice);
      const isRealDeal = deal.isGoodDeal && estimate?.source === "api";

      const marker = L.marker([apartment.lat, apartment.lng], {
        icon: createPriceIcon(apartment.price, isRealDeal),
      });

      const area = apartment.meters ?? apartment.size ?? "?";
      const meta = [
        `${area} m²`,
        apartment.rooms > 0 ? `${apartment.rooms} bed` : null,
        apartment.bathrooms > 0 ? `${apartment.bathrooms} bath` : null,
        apartment.floor > 0 ? `Floor ${apartment.floor}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      marker.bindPopup(`
        <div class="map-popup">
          <p class="map-popup-price">${formatPrice(apartment.price)}</p>
          ${isRealDeal ? '<span class="map-popup-deal">Below Market</span>' : ""}
          <p class="map-popup-meta">${meta}</p>
          ${apartment.location ? `<p class="map-popup-location">${apartment.location}</p>` : ""}
          <button class="map-popup-btn">View Property</button>
        </div>
      `);

      marker.on("popupopen", (e) => {
        const btn = e.popup.getElement()?.querySelector(".map-popup-btn");
        if (btn) btn.onclick = () => navigate(`/apartments/${id}`);
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, apartments, estimatesById, navigate]);

  return null;
}

export default function MapView({ apartments, estimatesById }) {
  const navigate = useNavigate();

  return (
    <div className="map-wrapper">
      <MapContainer center={TIRANA_CENTER} zoom={13} className="map-container" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClusterLayer apartments={apartments} estimatesById={estimatesById} navigate={navigate} />
      </MapContainer>
    </div>
  );
}
