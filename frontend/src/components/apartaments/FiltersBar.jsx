export default function FiltersBar({
  sort,
  onSortChange,
  goodDealsOnly,
  onGoodDealsChange,
  priceRange,
  priceRangeMax,
  onPriceRangeChange,
}) {
  const max = Number(priceRangeMax) > 0 ? Number(priceRangeMax) : 2200;
  const min = 0;
  const step = max > 100000 ? 1000 : 100;

  return (
    <section className="apartments-filtersRow">
      <div className="apartments-filterGroup">
        <label htmlFor="apartments-sort">Sort</label>
        <select id="apartments-sort" value={sort} onChange={onSortChange}>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="size-asc">Size: small to large</option>
          <option value="size-desc">Size: large to small</option>
          <option value="ppm-asc">Price/m²: low to high</option>
          <option value="ppm-desc">Price/m²: high to low</option>
        </select>
      </div>

      <label className="apartments-toggle">
        <input type="checkbox" checked={goodDealsOnly} onChange={onGoodDealsChange} />
        <span>Show good deals only</span>
      </label>

      <div className="apartments-sliderPlaceholder">
        <label htmlFor="apartments-priceRange">Price range</label>
        <input
          id="apartments-priceRange"
          type="range"
          min={min}
          max={max}
          step={step}
          value={priceRange}
          onChange={onPriceRangeChange}
        />
        <small>Up to {Math.round(priceRange).toLocaleString()} €</small>
      </div>
    </section>
  );
}
