import { useEffect, useMemo, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useApartments } from "../components/hooks/useApartments";
import SearchBar from "../components/apartaments/SearchBar";
import FiltersBar from "../components/apartaments/FiltersBar";
import ApartmentCard from "../components/apartaments/ApartmentCard";
import MapView from "../components/apartaments/MapView";
import { evaluateDeal, getEstimate } from "../services/estimatorService";
import { useCompare } from "../context/CompareContext";
import "../components/apartaments/apartments.css";

function toEstimatePayload(listing) {
  return {
    id: listing.id || listing._id,
    price: listing.price,
    size: listing.size ?? listing.meters,
    rooms: listing.rooms,
    bathrooms: listing.bathrooms,
    floor: listing.floor,
    location: listing.location,
    lat: listing.lat,
    lng: listing.lng,
    hasElevator: listing.hasElevator,
    hasParking: listing.hasParking,
    hasGarage: listing.hasGarage,
    hasTerrace: listing.hasTerrace,
  };
}

function getListingId(listing) {
  return listing.id || listing._id;
}

const PAGE_SIZE = 24;

export default function ApartmentsPage() {
  const { apartments, loading, error } = useApartments();
  const { compareList, addToCompare, removeFromCompare } = useCompare();

  const [searchValues, setSearchValues] = useState({
    location: "",
    minPrice: "",
    maxPrice: "",
    rooms: "",
    bathrooms: "",
    minSqm: "",
    maxSqm: "",
    elevatorOnly: false,
    parkingOnly: false,
    garageOnly: false,
    terraceOnly: false,
  });
  const [appliedSearch, setAppliedSearch] = useState({
    location: "",
    minPrice: "",
    maxPrice: "",
    rooms: "",
    bathrooms: "",
    minSqm: "",
    maxSqm: "",
    elevatorOnly: false,
    parkingOnly: false,
    garageOnly: false,
    terraceOnly: false,
  });
  const [sort, setSort] = useState("price-asc");
  const [viewMode, setViewMode] = useState("grid");
  const [goodDealsOnly, setGoodDealsOnly] = useState(false);
  const [priceRange, setPriceRange] = useState(2200);

  const [estimatesById, setEstimatesById] = useState({});
  const [loadingEstimates, setLoadingEstimates] = useState(false);
  const [estimateError, setEstimateError] = useState("");
  const [compareNotice, setCompareNotice] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!apartments.length) return;
    let active = true;

    (async () => {
      try {
        setLoadingEstimates(true);
        setEstimateError("");

        // Only fetch estimates for the current visible batch + one page ahead.
        // This avoids firing N requests for all listings on initial load.
        const fetchUpTo = Math.min(visibleCount + PAGE_SIZE, apartments.length);
        const missingListings = apartments.slice(0, fetchUpTo).filter((listing) => {
          const id = getListingId(listing);
          return !estimatesById[id];
        });

        if (!missingListings.length) return;

        const results = await Promise.all(
          missingListings.map(async (listing) => {
            const id = getListingId(listing);
            const estimate = await getEstimate(toEstimatePayload(listing));
            return [id, estimate];
          })
        );

        if (!active) return;
        setEstimatesById((prev) => ({
          ...prev,
          ...Object.fromEntries(results),
        }));
      } catch (e) {
        if (active) setEstimateError(e?.message || "Failed to run deal finder.");
      } finally {
        if (active) setLoadingEstimates(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [apartments, visibleCount, estimatesById]);

  function handleSearchChange(e) {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setSearchValues((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setSearchValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setAppliedSearch(searchValues);
  }

  function handleClearSearch() {
    const cleared = {
      location: "",
      minPrice: "",
      maxPrice: "",
      rooms: "",
      bathrooms: "",
      minSqm: "",
      maxSqm: "",
      elevatorOnly: false,
      parkingOnly: false,
      garageOnly: false,
      terraceOnly: false,
    };
    setSearchValues(cleared);
    setAppliedSearch(cleared);
    setGoodDealsOnly(false);
    setPriceRange(priceRangeMax);
  }

  const priceRangeMax = useMemo(() => {
    const prices = apartments
      .map((apartment) => Number(apartment.price) || 0)
      .filter((value) => value > 0);
    if (!prices.length) return 2200;
    return Math.max(...prices);
  }, [apartments]);

  useEffect(() => {
    if (!apartments.length) return;
    setPriceRange((current) => (current === 2200 ? priceRangeMax : Math.min(current, priceRangeMax)));
  }, [apartments, priceRangeMax]);

  function isCompared(listing) {
    const id = getListingId(listing);
    return compareList.some((item) => getListingId(item) === id);
  }

  function handleCompareToggle(listing) {
    const id = getListingId(listing);
    if (isCompared(listing)) {
      removeFromCompare(id);
      setCompareNotice("Removed from comparison.");
      return;
    }

    const result = addToCompare(listing);
    setCompareNotice(result.message);
  }

  const filteredApartments = useMemo(() => {
    const location = appliedSearch.location.trim().toLowerCase();
    const minPrice = Number(appliedSearch.minPrice) || 0;
    const maxPrice = Number(appliedSearch.maxPrice) || Number.POSITIVE_INFINITY;
    const rooms = Number(appliedSearch.rooms) || 0;
    const bathrooms = Number(appliedSearch.bathrooms) || 0;
    const minSqm = Number(appliedSearch.minSqm) || 0;
    const maxSqm = Number(appliedSearch.maxSqm) || Number.POSITIVE_INFINITY;
    const elevatorOnly = Boolean(appliedSearch.elevatorOnly);
    const parkingOnly = Boolean(appliedSearch.parkingOnly);
    const garageOnly = Boolean(appliedSearch.garageOnly);
    const terraceOnly = Boolean(appliedSearch.terraceOnly);

    const base = apartments.filter((apartment) => {
      const aptLocation = (apartment.location || "").toLowerCase();
      const price = Number(apartment.price) || 0;
      const aptRooms = Number(apartment.rooms) || 0;
      const aptBathrooms = Number(apartment.bathrooms) || 0;
      const aptSqm = Number(apartment.size ?? apartment.meters) || 0;
      const estimate = estimatesById[getListingId(apartment)];
      const deal = evaluateDeal(apartment.price, estimate?.estimatedPrice);
      const isRealDeal = deal.isGoodDeal && estimate?.source === "api";

      const matchesLocation = !location || aptLocation.includes(location);
      const matchesMinPrice = price >= minPrice;
      const matchesMaxPrice = price <= maxPrice;
      const matchesRooms = !rooms || aptRooms >= rooms;
      const matchesBathrooms = !bathrooms || aptBathrooms >= bathrooms;
      const matchesSqm = aptSqm >= minSqm;
      const matchesMaxSqm = aptSqm <= maxSqm;
      const matchesElevator = !elevatorOnly || apartment.hasElevator === true;
      const matchesParking = !parkingOnly || apartment.hasParking === true;
      const matchesGarage = !garageOnly || apartment.hasGarage === true;
      const matchesTerrace = !terraceOnly || apartment.hasTerrace === true;
      const matchesGoodDeals = !goodDealsOnly || isRealDeal;
      const matchesRange = price <= priceRange;

      return (
        matchesLocation &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesRooms &&
        matchesBathrooms &&
        matchesSqm &&
        matchesMaxSqm &&
        matchesElevator &&
        matchesParking &&
        matchesGarage &&
        matchesTerrace &&
        matchesGoodDeals &&
        matchesRange
      );
    });

    const sorted = [...base];
    sorted.sort((a, b) => {
      const aPrice = Number(a.price) || 0;
      const bPrice = Number(b.price) || 0;
      const aSqm = Number(a.size ?? a.meters) || 0;
      const bSqm = Number(b.size ?? b.meters) || 0;
      const aPpm = aSqm > 0 ? aPrice / aSqm : 0;
      const bPpm = bSqm > 0 ? bPrice / bSqm : 0;
      if (sort === "price-desc") return bPrice - aPrice;
      if (sort === "size-asc") return aSqm - bSqm;
      if (sort === "size-desc") return bSqm - aSqm;
      if (sort === "ppm-asc") return aPpm - bPpm;
      if (sort === "ppm-desc") return bPpm - aPpm;
      return aPrice - bPrice; // default: price-asc
    });
    return sorted;
  }, [apartments, appliedSearch, sort, goodDealsOnly, priceRange, estimatesById]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [appliedSearch, sort, goodDealsOnly, priceRange]);

  const visibleApartments = useMemo(
    () => filteredApartments.slice(0, visibleCount),
    [filteredApartments, visibleCount]
  );

  const canLoadMore = visibleCount < filteredApartments.length;

  return (
    <motion.main
      className="apartments-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="apartments-container">
        <h1 className="apartments-title">Apartments</h1>

        <SearchBar
          values={searchValues}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
          onClear={handleClearSearch}
        />

        <FiltersBar
          sort={sort}
          onSortChange={(e) => setSort(e.target.value)}
          goodDealsOnly={goodDealsOnly}
          onGoodDealsChange={(e) => setGoodDealsOnly(e.target.checked)}
          priceRange={priceRange}
          priceRangeMax={priceRangeMax}
          onPriceRangeChange={(e) => setPriceRange(Number(e.target.value))}
        />

        <section className="apartments-resultsHeader">
          <p>{filteredApartments.length} Apartments Found</p>
          <div className="apartments-resultsActions">
            <Link to="/tools/compare" className="apartments-compareNowBtn">
              Compare Now ({compareList.length}/3)
            </Link>
            <button
              type="button"
              className={`apartments-viewToggle${viewMode === "map" ? " apartments-viewToggle--active" : ""}`}
              onClick={() => setViewMode((v) => (v === "grid" ? "map" : "grid"))}
            >
              {viewMode === "grid" ? "Map View" : "Grid View"}
            </button>
            <div className="apartments-filterGroup apartments-filterGroupInline">
              <label htmlFor="apartments-sort-inline">Sort</label>
              <select
                id="apartments-sort-inline"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="size-asc">Size: small to large</option>
                <option value="size-desc">Size: large to small</option>
                <option value="ppm-asc">Price/m²: low to high</option>
                <option value="ppm-desc">Price/m²: high to low</option>
              </select>
            </div>
          </div>
        </section>

        {compareNotice ? <p className="apartments-state apartments-compareNotice">{compareNotice}</p> : null}

        {loading ? <p className="apartments-state">Loading...</p> : null}
        {error ? <p className="apartments-state apartments-error">{error}</p> : null}
        {loadingEstimates ? <p className="apartments-state">Running Deal Finder...</p> : null}
        {estimateError ? <p className="apartments-state apartments-error">{estimateError}</p> : null}

        {!loading && !error ? (
          filteredApartments.length ? (
            viewMode === "map" ? (
              <MapView apartments={filteredApartments} estimatesById={estimatesById} />
            ) : (
              <>
                <section className="apartments-grid">
                  {visibleApartments.map((apartment) => {
                    const id = getListingId(apartment);
                    const estimate = estimatesById[id];
                    const deal = evaluateDeal(apartment.price, estimate?.estimatedPrice);
                    const isRealDeal = deal.isGoodDeal && estimate?.source === "api";

                    return (
                      <ApartmentCard
                        key={id}
                        apartment={apartment}
                        isGoodDeal={isRealDeal}
                        savingsPercent={deal.savingsPercent}
                        estimatedPrice={estimate?.estimatedPrice ?? null}
                        isCompared={isCompared(apartment)}
                        compareDisabled={!isCompared(apartment) && compareList.length >= 3}
                        onToggleCompare={() => handleCompareToggle(apartment)}
                      />
                    );
                  })}
                </section>
                {canLoadMore ? (
                  <div className="apartments-loadMoreWrap">
                    <button
                      type="button"
                      className="apartments-loadMoreMainBtn"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    >
                      Load more
                    </button>
                  </div>
                ) : null}
              </>
            )
          ) : (
            <p className="apartments-empty">No apartments match the current filters.</p>
          )
        ) : null}
      </div>
    </motion.main>
  );
}
