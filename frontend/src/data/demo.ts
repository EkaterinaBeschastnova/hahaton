import {
  getDemoMyHouses,
} from "./housesDatabase";

/**
 * Compatibility exports for older components.
 * New code should use HouseStore instead.
 */
export const houses =
  getDemoMyHouses();

export const events =
  houses.flatMap(
    (house) =>
      house.events.map(
        (event) => ({
          ...event,
          house: house.address,
          houseId: house.id,
        })
      )
  );

export const demoRequests =
  houses.flatMap(
    (house) =>
      house.requests
  );
