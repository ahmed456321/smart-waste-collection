let map;
let markersLayer = L.layerGroup();
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function initReportMap() {
    const defaultLoc = [40.7128, -74.0060];
    map = L.map('map', {
        center: defaultLoc,
        zoom: 15,
        zoomControl: false,
        attributionControl: false
    });

    L.tileLayer(DARK_TILES, { attribution: ATTRIBUTION }).addTo(map);

    const ecoMarkerIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:#10b981; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow: 0 0 10px rgba(16,185,129,0.5);'></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    let marker = L.marker(defaultLoc, { icon: ecoMarkerIcon, draggable: true }).addTo(map);

    window.updateMapMarker = (coords) => {
        const newPos = [coords.lat, coords.lng];
        map.setView(newPos, 15);
        marker.setLatLng(newPos);
    };

    // Update coordinates on drag
    marker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        window.currentCoords = { lat: pos.lat, lng: pos.lng };
        document.getElementById('locationStatus').innerText = `MANUAL OVERRIDE: ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`;
    });
}

window.adminMapLargeInstance = null;

async function initAdminMap() {
    try {
        // Must use fetchWithAuth for secure backend routes
        const res = await fetchWithAuth(`${API_URL}/admin/reports`);
        if (!res || !res.ok) return;
        const reports = await res.json();
        
        // 1. SMALL MAP (Overview)
        const smallMapContainer = document.getElementById('adminMapSmall');
        if (smallMapContainer) smallMapContainer.innerHTML = '';
        
        const mapSmall = L.map('adminMapSmall', {
            center: [40.7128, -74.0060], zoom: 12, zoomControl: false, attributionControl: false
        });
        L.tileLayer(DARK_TILES, { attribution: ATTRIBUTION }).addTo(mapSmall);

        // 2. LARGE MAP (Dedicated Tab)
        const largeMapContainer = document.getElementById('adminMapLarge');
        if (largeMapContainer) largeMapContainer.innerHTML = '';
        
        const mapLarge = L.map('adminMapLarge', {
            center: [40.7128, -74.0060], zoom: 12, zoomControl: true, attributionControl: false
        });
        window.adminMapLargeInstance = mapLarge;
        L.tileLayer(DARK_TILES, { attribution: ATTRIBUTION }).addTo(mapLarge);

        const bounds = [];

        reports.forEach(report => {
            const color = report.status === 'pending' ? '#f59e0b' : '#10b981';
            const pos = [parseFloat(report.location.lat), parseFloat(report.location.lng)];
            
            const createMarker = () => {
                const markerIcon = L.divIcon({
                    className: 'report-icon',
                    html: `<div style='background-color:${color}; width:10px; height:10px; border-radius:50%; border:2px solid #fff; box-shadow: 0 0 10px ${color}88;'></div>`,
                    iconSize: [10, 10]
                });

                return L.marker(pos, { icon: markerIcon })
                    .bindPopup(`
                        <div style="padding: 10px; color: #fff; background: #020617; border-radius: 8px;">
                            <h4 style="margin: 0 0 5px 0; color: #10b981;">${report.category.toUpperCase()}</h4>
                            <p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">${report.description || 'No notes.'}</p>
                            <hr style="border:0; border-top:1px solid #1e293b; margin: 8px 0;">
                            <div style="font-size: 0.7rem; font-weight: 700; color:${color}">${report.status.toUpperCase()}</div>
                        </div>
                    `, { className: 'glass-popup' });
            };

            createMarker().addTo(mapSmall);
            createMarker().addTo(mapLarge);
            bounds.push(pos);
        });

        if (bounds.length > 0) {
            mapSmall.fitBounds(bounds);
            mapLarge.fitBounds(bounds);
        }
    } catch (err) {
        console.error("Failed to load map reports:", err);
    }
}
