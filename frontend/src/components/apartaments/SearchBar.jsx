export default function SearchBar({ values, onChange, onSubmit, onClear }) {
  return (
    <section className="apartments-searchSection">
      <form className="apartments-searchBar" onSubmit={onSubmit}>
        <div className="apartments-field">
          <label htmlFor="apartments-location">Location</label>
          <input
            id="apartments-location"
            type="text"
            name="location"
            placeholder="City or neighborhood"
            value={values.location}
            onChange={onChange}
          />
        </div>

        <div className="apartments-field">
          <label htmlFor="apartments-minPrice">Min price</label>
          <input
            id="apartments-minPrice"
            type="number"
            name="minPrice"
            placeholder="0"
            value={values.minPrice}
            onChange={onChange}
            min="0"
          />
        </div>

        <div className="apartments-field">
          <label htmlFor="apartments-maxPrice">Max price</label>
          <input
            id="apartments-maxPrice"
            type="number"
            name="maxPrice"
            placeholder="No limit"
            value={values.maxPrice}
            onChange={onChange}
            min="0"
          />
        </div>

        <div className="apartments-field">
          <label htmlFor="apartments-rooms">Rooms</label>
          <input
            id="apartments-rooms"
            type="number"
            name="rooms"
            placeholder="Any"
            value={values.rooms}
            onChange={onChange}
            min="1"
          />
        </div>

        <div className="apartments-field">
          <label htmlFor="apartments-bathrooms">Bathrooms</label>
          <input
            id="apartments-bathrooms"
            type="number"
            name="bathrooms"
            placeholder="Any"
            value={values.bathrooms}
            onChange={onChange}
            min="1"
          />
        </div>

        <div className="apartments-field">
          <label htmlFor="apartments-minSqm">Min m²</label>
          <input
            id="apartments-minSqm"
            type="number"
            name="minSqm"
            placeholder="0"
            value={values.minSqm}
            onChange={onChange}
            min="0"
          />
        </div>

        <div className="apartments-field">
          <label htmlFor="apartments-maxSqm">Max m²</label>
          <input
            id="apartments-maxSqm"
            type="number"
            name="maxSqm"
            placeholder="No limit"
            value={values.maxSqm}
            onChange={onChange}
            min="0"
          />
        </div>

        <label className="apartments-toggle apartments-toggleInline">
          <input
            type="checkbox"
            name="elevatorOnly"
            checked={Boolean(values.elevatorOnly)}
            onChange={onChange}
          />
          <span>Elevator</span>
        </label>

        <label className="apartments-toggle apartments-toggleInline">
          <input
            type="checkbox"
            name="parkingOnly"
            checked={Boolean(values.parkingOnly)}
            onChange={onChange}
          />
          <span>Parking</span>
        </label>

        <label className="apartments-toggle apartments-toggleInline">
          <input
            type="checkbox"
            name="garageOnly"
            checked={Boolean(values.garageOnly)}
            onChange={onChange}
          />
          <span>Garage</span>
        </label>

        <label className="apartments-toggle apartments-toggleInline">
          <input
            type="checkbox"
            name="terraceOnly"
            checked={Boolean(values.terraceOnly)}
            onChange={onChange}
          />
          <span>Terrace</span>
        </label>

        <div className="apartments-searchActions">
          <button className="apartments-btn apartments-btnPrimary" type="submit">
            Search
          </button>
          <button className="apartments-btn apartments-btnGhost" type="button" onClick={onClear}>
            Clear
          </button>
        </div>
      </form>
    </section>
  );
}
